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
**Cause:** Backend not running or CORS issue
**Fix:** Start backend, check CORS settings

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
   - Backend: `OPENAI_API_KEY`, `DEBUG`, etc.

---

## Need More Help?

Check these files:
- `LOCAL_DEVELOPMENT.md` - Setup guide
- `FRONTEND_BACKEND_CONNECTION.md` - Connection details
- `backend/aws_exam_backend/settings.py` - Backend config
- `typescript_simplified_app_with_timer/src/utils/api.ts` - API client

