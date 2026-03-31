# Troubleshooting Guide

## Issue: Frontend Stuck on "Loading questions..."

### Problem
The React frontend shows "Loading questions..." indefinitely and never loads.

### Causes

1. **Backend not running**
   - Backend server not started
   - Backend crashed or stopped

2. **API call hanging**
   - Question generation taking too long
   - Missing OpenAI API key
   - Network timeout

3. **CORS issues**
   - Backend not allowing frontend origin
   - Browser blocking requests

4. **Database issues**
   - No exams in database
   - Questions endpoint failing

---

## Solutions

### 1. Check Backend is Running

**Check if backend is running:**
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000
```

**Start backend if not running:**
```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

**Verify backend is responding:**
- Open browser: http://localhost:8000/api/exams/
- Should see JSON response with exams

---

### 2. Check Browser Console

**Open browser DevTools (F12) and check:**
1. Console tab for errors
2. Network tab for failed requests
3. Check if API calls are pending or failed

**Common errors:**
- `Failed to fetch` - Backend not running or CORS issue
- `Timeout` - API call taking too long
- `404 Not Found` - API endpoint doesn't exist
- `500 Internal Server Error` - Backend error

---

### 3. Check CORS Configuration

**Backend settings** (`backend/aws_exam_backend/settings.py`):
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend dev server
]
```

**Verify CORS headers:**
- Open browser DevTools → Network tab
- Check API response headers
- Look for `Access-Control-Allow-Origin: http://localhost:5173`

---

### 4. Check API Endpoints

**Test backend endpoints:**
```bash
# List exams
curl http://localhost:8000/api/exams/

# Get exam by type
curl http://localhost:8000/api/exams/by-type/solutions_architect/

# Get random questions (requires exam ID)
curl http://localhost:8000/api/exams/1/random-questions/?limit=50
```

**Expected responses:**
- Should return JSON data
- No 404 or 500 errors

---

### 5. Check OpenAI API Key

**Question generation requires API key:**
```bash
# Check backend .env file
cd backend
cat .env | findstr OPENAI_API_KEY
```

**If missing:**
1. Create `.env` file in `backend/` directory
2. Add: `OPENAI_API_KEY=your-api-key-here`
3. Restart backend server

**Without API key:**
- Questions won't generate
- Frontend will timeout waiting for questions
- Check console for "No API key" errors

---

### 6. Add Timeout and Error Handling

**Fixed in latest code:**
- Added 60-second timeout for question loading
- Added error display with retry button
- Better error messages

**If still hanging:**
1. Check browser console for timeout errors
2. Click "Try Again" button if error appears
3. Check backend logs for errors

---

### 7. Skip Question Generation (Use Existing)

**If questions already exist in database:**
- Frontend should fetch existing questions immediately
- No need to generate new questions
- Generation only runs if pool is below 100 questions

**Check database:**
```bash
cd backend
venv\Scripts\activate
python manage.py shell
```

```python
from exams.models import Exam, Question

# Check questions count
exam = Exam.objects.get(exam_type='solutions_architect')
print(f"Questions: {exam.questions_count}")
print(f"Total questions: {Question.objects.filter(exam=exam).count()}")
```

---

### 8. Verify Database Has Exams

**Create exams if missing:**
```bash
cd backend
venv\Scripts\activate
python manage.py create_exams
```

**Verify exams exist:**
```bash
curl http://localhost:8000/api/exams/
```

Should return JSON with at least 2 exams:
- AWS Solutions Architect
- AWS Cloud Practitioner

---

## Issue: Render backend fails or API errors — database not connected

### Problem

On Render, the Django backend uses PostgreSQL when `DATABASE_URL` is set (see `backend/aws_exam_backend/settings.py`). If there is no database, or `DATABASE_URL` is missing or wrong, deploys can fail at startup or the API will not work reliably in production.

### Typical symptoms

- Startup logs: `migrate` retries then failure, or connection refused / authentication errors to PostgreSQL
- Health check or `/api/exams/` failing after deploy
- Backend service crashes or restarts in a loop

### Causes

1. **No PostgreSQL instance** on Render for this project
2. **`DATABASE_URL` missing, incorrect, or not linked** from the database resource to the web service
3. **Region mismatch** (less common): backend and database in different regions can cause latency or connection issues; prefer the same region

### Resolution

1. **Create a PostgreSQL** instance on Render (same region as the backend service when possible).
2. **Set `DATABASE_URL` on the backend service** (e.g. **aws-exam-backend** → **Environment**):
   - Prefer **linking** the database so Render injects the connection string (same idea as `fromDatabase` in `render.yaml`).
   - Or set it manually using the **Internal Database URL** / connection string from the database dashboard.
3. **Save** environment variables and **redeploy** the backend (manual deploy is enough; no code change required).
4. **Confirm** in service logs that `migrate` succeeds and Gunicorn starts (the deploy start command retries migrations until Postgres is reachable).

For full environment variable tables and deploy steps, see `RENDER_DEPLOYMENT.md` and `ENVIRONMENT_VARIABLES_GUIDE.md`.

---

---

## Issue: AI Assistant shows "Failed to fetch" when selecting a syllabus

### Problem

Clicking a syllabus button (Solutions Architect, Cloud Practitioner, Developer) in the AI Study Assistant modal shows **"Failed to fetch"** in red and never loads the lecture plan.

### Cause

The Render free-tier **web service goes to sleep** after 15 minutes of inactivity. When asleep, Render immediately closes any incoming TCP connection instead of returning an HTTP response. The browser receives a network-level failure (`TypeError: Failed to fetch`) rather than an HTTP error code.

### Resolution

**Automatic retry (already in the code):** `getSyllabusLectures` in `api.ts` now retries once after a 4-second pause when a network-level failure is detected. During the retry the modal shows *"Server is waking up, please wait a moment..."* instead of the error message.

**If the retry also fails**, the server is taking longer than usual to wake. Wait 10–15 seconds and click the syllabus button again — subsequent requests will succeed once Render's service is fully awake.

**To prevent this permanently:** Upgrade the Render web service from the free tier to a paid plan (Starter or above), which keeps the service always on.

### Key files changed

- `typescript_simplified_app_with_timer/src/utils/api.ts` — `getSyllabusLectures` now accepts an `onRetry` callback and retries once on `TypeError` or `AbortError`
- `typescript_simplified_app_with_timer/src/components/AIAssistantModal.tsx` — added `statusMsg` prop to show the "waking up" message in the loading state
- `typescript_simplified_app_with_timer/src/App.tsx` — passes the `onRetry` callback that sets `assistantStatusMsg`

---

## Issue: AI Assistant quick-prompt buttons do nothing / streaming response is empty

### Problem

1. Clicking a suggested quick-prompt button (e.g. "Give me a 7-day study plan from these lectures") only fills the text input but **never sends the message**.
2. After manually sending, the assistant bubble appears empty and stays empty — the streaming response text never renders.

### Cause

**Bug 1 — Quick prompts never sent:** The `onClick` handler on quick-prompt buttons only called `onChatInputChange(prompt)` (sets the input value). Because React state updates are asynchronous, immediately calling `onSendMessage()` right after would read a still-empty `assistantChatInput`. The message appeared to be submitted only after the user pressed Enter or clicked Send manually.

**Bug 2 — Streaming text invisible:** The `handleAssistantSendMessage` function used `let accumulated = ''` declared in the outer scope. Subsequent `setAssistantChatMessages` calls inside the `onDelta` closure could reference a stale copy of `accumulated` due to React's closure-capture behaviour, resulting in the assistant bubble staying empty even though tokens were arriving from the backend.

### Resolution

- Added a dedicated `sendChatMessage(text: string)` helper that accepts the message directly, bypassing React input state entirely. Both the send button and quick-prompt buttons now call this helper.
- Replaced `let accumulated` with a plain mutable object `const acc = { text: '' }`. Each `onDelta` call captures a fresh `snapshot` of `acc.text` before passing it to `setAssistantChatMessages`, eliminating the stale-closure issue.
- Added `onQuickPromptSend: (text: string) => void` prop to `AIAssistantModal` so the modal calls `handleAssistantQuickPrompt(text)` directly on button click.

### Key files changed

- `typescript_simplified_app_with_timer/src/App.tsx` — refactored `handleAssistantSendMessage` into `sendChatMessage`, added `handleAssistantQuickPrompt`
- `typescript_simplified_app_with_timer/src/components/AIAssistantModal.tsx` — added `onQuickPromptSend` prop; quick-prompt buttons now call `onQuickPromptSend(prompt)` instead of `onChatInputChange(prompt)`

---

## Quick Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Backend API responding: http://localhost:8000/api/exams/
- [ ] CORS configured correctly
- [ ] Exams exist in database
- [ ] Browser console has no errors
- [ ] Network tab shows API requests (not pending)
- [ ] OpenAI API key set (if generating questions)

---

## Common Error Messages

### "Failed to fetch"
**Cause:** Backend not running, CORS issue, or Render free-tier service is asleep
**Fix:** Start backend, check CORS settings. If the error appears in the AI Assistant modal, see *Issue: AI Assistant shows "Failed to fetch" when selecting a syllabus* above — the server is likely waking up and will retry automatically.

### "Request timed out"
**Cause:** API call taking too long
**Fix:** Check OpenAI API key, check backend logs

### "No exam found for type"
**Cause:** Exams not created in database
**Fix:** Run `python manage.py create_exams`

### "No questions available"
**Cause:** No questions in database
**Fix:** Generate questions first (requires API key)

---

## Still Not Working?

1. **Check browser console** - Look for specific error messages
2. **Check backend logs** - Django server terminal output
3. **Check network tab** - See what API calls are failing
4. **Restart both servers** - Stop and start frontend and backend
5. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

---

## Debug Steps

1. **Test backend directly:**
   ```bash
   curl http://localhost:8000/api/exams/
   ```

2. **Check frontend console:**
   - Open DevTools (F12)
   - Look for errors or pending requests

3. **Test API endpoints:**
   - Try each endpoint manually
   - Check response status and data

4. **Check database:**
   - Verify exams exist
   - Verify questions exist (if any)

5. **Check environment variables:**
   - Frontend: `VITE_API_BASE_URL`
   - Backend (local): `OPENAI_API_KEY`, `DEBUG`, etc.
   - Backend (Render / production): `DATABASE_URL` must point to your PostgreSQL instance (see **Issue: Render backend fails or API errors — database not connected** above)

---

## Need More Help?

Check these files:
- `LOCAL_DEVELOPMENT.md` - Setup guide
- `RENDER_DEPLOYMENT.md` - Render deploy and database linking
- `FRONTEND_BACKEND_CONNECTION.md` - Connection details
- `backend/aws_exam_backend/settings.py` - Backend config
- `typescript_simplified_app_with_timer/src/utils/api.ts` - API client

