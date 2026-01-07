# Quick Start Guide - Run Frontend & Backend Locally

## ✅ What's Already Done

1. ✅ Backend virtual environment created
2. ✅ Backend dependencies installed
3. ✅ Database migrations applied
4. ✅ Initial exams created (AWS Solutions Architect, AWS Cloud Practitioner)
5. ✅ Frontend dependencies installed

---

## 🚀 Start Both Services

### Option 1: Use Two Terminal Windows (Recommended)

#### Terminal 1: Backend Server

```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

**Backend will run at**: http://localhost:8000

You should see:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

#### Terminal 2: Frontend Server

```bash
cd typescript_simplified_app_with_timer
npm run dev
```

**Frontend will run at**: http://localhost:5173

You should see:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🌐 Access Your Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin/

---

## 🧪 Test the Connection

1. **Open Frontend**: http://localhost:5173
2. **Select an exam type** (AWS Solutions Architect or Cloud Practitioner)
3. **First time**: Questions will be generated automatically (50 questions)
4. **Check browser console** for any errors

---

## 📝 Verify Backend is Running

Open browser and visit: http://localhost:8000/api/exams/

You should see JSON data with the two exams:
```json
[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "exam_type": "solutions_architect",
    ...
  },
  {
    "id": 2,
    "name": "AWS Cloud Practitioner",
    "exam_type": "cloud_practitioner",
    ...
  }
]
```

---

## 🔧 Troubleshooting

### Backend Not Starting

**Port 8000 already in use?**
```bash
python manage.py runserver 8001
```

Then update frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8001/api
```

**Virtual environment not activated?**
```bash
cd backend
venv\Scripts\activate  # Windows
```

### Frontend Not Starting

**Port 5173 already in use?**
Vite will automatically use the next available port (5174, 5175, etc.)

**Dependencies not installed?**
```bash
cd typescript_simplified_app_with_timer
npm install
```

### API Connection Issues

1. **Check backend is running**: Visit http://localhost:8000/api/exams/
2. **Check frontend console**: Open DevTools (F12) → Console tab
3. **Verify API URL**: Should be `http://localhost:8000/api` by default

---

## 🛑 Stop Servers

Press `Ctrl+C` in each terminal window to stop the servers.

---

## 📚 Next Steps

1. ✅ Backend running on http://localhost:8000
2. ✅ Frontend running on http://localhost:5173
3. ✅ Test the application
4. ✅ Start developing!

---

## 📋 Environment Variables (Optional)

### Backend (.env file in `backend/`)

```env
DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key (optional, for question generation)
```

### Frontend (.env file in `typescript_simplified_app_with_timer/`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Note**: Frontend already defaults to `http://localhost:8000/api` if not set.

---

## ✅ Status Check

| Component | Status | URL |
|-----------|--------|-----|
| Backend | ✅ Ready | http://localhost:8000 |
| Frontend | ✅ Ready | http://localhost:5173 |
| Database | ✅ Initialized | SQLite (db.sqlite3) |
| Exams | ✅ Created | 2 exams ready |

**You're all set! Start developing! 🚀**

