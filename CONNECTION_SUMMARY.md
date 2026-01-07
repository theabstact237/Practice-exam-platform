# Frontend-Backend Connection Summary

## 🎯 Quick Answer

The React frontend and Django backend are **separate applications** that communicate via **HTTP REST API calls** using JSON.

---

## 🔗 How They Connect

### 1. **Frontend Configuration**
```typescript
// typescript_simplified_app_with_timer/src/utils/api.ts
const API_BASE_URL = 'http://localhost:8000/api';
```

### 2. **Backend Configuration**
```python
# backend/aws_exam_backend/settings.py
CORS_ALLOWED_ORIGINS = ['http://localhost:5173']  # Allows frontend
```

### 3. **Communication**
```
Frontend (React)          Backend (Django)
     │                          │
     │  HTTP GET /api/exams/   │
     ├─────────────────────────>│
     │                          │
     │  JSON Response           │
     │<─────────────────────────┤
     │                          │
```

---

## 📋 Example Flow

### User Clicks "AWS Solutions Architect"

**Step 1: Frontend Code**
```typescript
// App.tsx calls
const questions = await getOrGenerateExamQuestions('solutions_architect', 50);
```

**Step 2: HTTP Request**
```http
GET http://localhost:8000/api/exams/by-type/solutions_architect/
```

**Step 3: Backend Processes**
```python
# exams/views.py
exams = Exam.objects.filter(exam_type='solutions_architect')
return Response(serializer.data)  # Returns JSON
```

**Step 4: Frontend Receives JSON**
```json
[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "questions_count": 0
  }
]
```

**Step 5: React Updates UI**
- Transforms JSON to React state
- Displays questions to user

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `src/utils/api.ts` | Frontend API client - makes HTTP requests |
| `src/App.tsx` | React component - uses API client |
| `exams/views.py` | Backend API endpoints - handles requests |
| `exams/urls.py` | Backend URL routing - defines endpoints |
| `settings.py` | CORS configuration - allows frontend requests |

---

## 🌐 Environment Variables

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Backend** (CORS in `settings.py`):
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
```

---

## ✅ Summary

- **Connection Type**: HTTP REST API (JSON)
- **Frontend**: React app on `localhost:5173`
- **Backend**: Django API on `localhost:8000`
- **Communication**: HTTP requests/responses
- **Configuration**: Environment variables + CORS settings

**They are separate applications that talk to each other over the network!** 🌐

