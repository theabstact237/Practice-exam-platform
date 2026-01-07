# Frontend-Backend Connection Explained

## Simple Overview

The React frontend and Django backend are **separate applications** that communicate via **HTTP REST API calls**. They don't share code - they talk to each other over the network.

---

## Connection Architecture

```
┌─────────────────────────────────────┐
│  Frontend (React/Vite)              │
│  Running on: http://localhost:5173  │
│                                     │
│  User clicks "AWS Solutions Arch"   │
│         ↓                           │
│  Makes HTTP request:                │
│  GET /api/exams/by-type/.../        │
└────────────┬────────────────────────┘
             │
             │ HTTP Request
             │ (JSON)
             ▼
┌─────────────────────────────────────┐
│  Backend (Django REST API)          │
│  Running on: http://localhost:8000  │
│                                     │
│  Receives request                   │
│  Queries database                   │
│  Returns JSON response              │
└────────────┬────────────────────────┘
             │
             │ HTTP Response
             │ (JSON data)
             ▼
┌─────────────────────────────────────┐
│  Frontend receives JSON             │
│  Displays questions to user         │
└─────────────────────────────────────┘
```

---

## How They Connect

### 1. **Frontend Knows Backend URL**

**File**: `typescript_simplified_app_with_timer/src/utils/api.ts`

```typescript
// This is where the frontend knows where to find the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**Local Development:**
- Defaults to: `http://localhost:8000/api`
- No configuration needed

**Production (Render):**
- Set via environment variable: `VITE_API_BASE_URL`
- Automatically set to: `https://aws-exam-backend.onrender.com/api`

---

### 2. **Frontend Makes API Calls**

**Example: User clicks on an exam**

```typescript
// In App.tsx - when user selects exam type
const apiQuestions = await getOrGenerateExamQuestions('solutions_architect', 50);
```

**What happens behind the scenes:**

```typescript
// In api.ts
export const getOrGenerateExamQuestions = async (examType) => {
  // Step 1: Call backend API
  const exams = await getExamsByType(examType);
  // This makes HTTP GET request to:
  // http://localhost:8000/api/exams/by-type/solutions_architect/
  
  // Step 2: Backend returns JSON
  // {
  //   "id": 1,
  //   "name": "AWS Solutions Architect",
  //   "questions_count": 0,
  //   ...
  // }
  
  // Step 3: If no questions, generate them
  if (exams[0].questions_count === 0) {
    await generateExamQuestions(examId, 50);
    // POST http://localhost:8000/api/exams/1/generate-questions/
  }
  
  // Step 4: Get random questions
  const questions = await getRandomExamQuestions(examId, 50);
  // GET http://localhost:8000/api/exams/1/random-questions/?limit=50
  
  return questions;
}
```

---

### 3. **Backend Receives and Processes**

**Backend Endpoints** (`backend/exams/views.py`):

```python
# When frontend calls: GET /api/exams/by-type/solutions_architect/
class ExamViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['get'], url_path='by-type/(?P<exam_type>[^/.]+)')
    def by_type(self, request, exam_type=None):
        # Query database
        exams = Exam.objects.filter(exam_type=exam_type, is_active=True)
        # Convert to JSON
        serializer = ExamSerializer(exams, many=True)
        # Return JSON response
        return Response(serializer.data)
```

**Backend returns JSON:**
```json
[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "exam_type": "solutions_architect",
    "questions_count": 0
  }
]
```

---

### 4. **CORS Configuration**

**Why CORS?**
- Browsers block requests between different origins (different ports/domains)
- Frontend (localhost:5173) needs permission to call Backend (localhost:8000)

**Backend allows frontend** (`backend/aws_exam_backend/settings.py`):

```python
# Development: Allow all origins
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # Allows frontend on any port

# Production: Only allow specific frontend URL
else:
    CORS_ALLOWED_ORIGINS = [
        "https://aws-exam-frontend.onrender.com"
    ]
```

**What this does:**
- Backend sends CORS headers in response
- Browser checks if frontend origin is allowed
- If allowed → request succeeds ✅
- If not allowed → browser blocks request ❌

---

## Complete Flow Example

### Scenario: User Selects Exam Type

**Step 1: User Action**
```
User clicks "AWS Solutions Architect" button in React UI
```

**Step 2: Frontend Code Executes**
```typescript
// App.tsx
useEffect(() => {
  const loadQuestions = async () => {
    const apiQuestions = await getOrGenerateExamQuestions('solutions_architect', 50);
    setQuestions(transformedQuestions);
  };
  loadQuestions();
}, [currentExamType]);
```

**Step 3: HTTP Request Sent**
```http
GET http://localhost:8000/api/exams/by-type/solutions_architect/
Host: localhost:8000
Origin: http://localhost:5173
```

**Step 4: Backend Processes**
```python
# Django receives request
# Query database
exams = Exam.objects.filter(exam_type='solutions_architect')
# Convert to JSON
return Response(serializer.data)
```

**Step 5: HTTP Response Received**
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Content-Type: application/json

[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "exam_type": "solutions_architect",
    "questions_count": 0
  }
]
```

**Step 6: Frontend Updates UI**
```typescript
// React receives JSON
// Transforms data
// Updates state
setQuestions(transformedQuestions);
// UI re-renders with questions
```

---

## Key Connection Points

### 1. **API Base URL** (Frontend Configuration)

**Location**: `typescript_simplified_app_with_timer/src/utils/api.ts:2`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**Purpose**: Tells frontend where to send API requests

---

### 2. **CORS Settings** (Backend Configuration)

**Location**: `backend/aws_exam_backend/settings.py:145-163`

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend dev server
]
```

**Purpose**: Allows frontend to make requests (browser security)

---

### 3. **REST API Endpoints** (Backend URLs)

**Location**: `backend/exams/urls.py` and `backend/exams/views.py`

```python
# URLs
router.register(r'exams', ExamViewSet)

# Views handle requests and return JSON
class ExamViewSet(viewsets.ModelViewSet):
    # Handles GET /api/exams/
    # Handles POST /api/exams/{id}/generate-questions/
    # etc.
```

**Purpose**: Define what endpoints are available and what they do

---

## API Endpoints Used

### Frontend → Backend API Calls

| Frontend Action | API Call | Backend Endpoint | Purpose |
|----------------|----------|------------------|---------|
| Load exam list | `GET /api/exams/by-type/{type}/` | `ExamViewSet.by_type()` | Get exam by type |
| Generate questions | `POST /api/exams/{id}/generate-questions/` | `ExamViewSet.generate_questions()` | Create questions via AI |
| Get questions | `GET /api/exams/{id}/random-questions/` | `ExamViewSet.random_questions()` | Get 50 random questions |

---

## Data Flow Example

### Complete Request-Response Cycle

```
1. User clicks "AWS Solutions Architect"
   ↓
2. React: getOrGenerateExamQuestions('solutions_architect')
   ↓
3. HTTP GET: http://localhost:8000/api/exams/by-type/solutions_architect/
   ↓
4. Django: Receives request → Queries database → Finds exam
   ↓
5. Django: Serializes to JSON → Sends response
   ↓
6. React: Receives JSON → Transforms data → Updates state
   ↓
7. React: Re-renders UI → Shows questions
```

---

## Communication Protocol

### HTTP REST API

**Method**: HTTP requests (GET, POST, PUT, DELETE)
**Format**: JSON (JavaScript Object Notation)
**Protocol**: HTTP/HTTPS

**Example Request:**
```http
GET /api/exams/by-type/solutions_architect/ HTTP/1.1
Host: localhost:8000
Origin: http://localhost:5173
```

**Example Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173

[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "exam_type": "solutions_architect"
  }
]
```

---

## Configuration Files

### Frontend Configuration

**1. API Base URL** (`src/utils/api.ts`):
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
```

**2. Environment Variable** (`.env` file):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend Configuration

**1. CORS Settings** (`settings.py`):
```python
CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
```

**2. URL Routing** (`urls.py`):
```python
path('api/', include('exams.urls'))
```

**3. API Views** (`exams/views.py`):
```python
class ExamViewSet(viewsets.ModelViewSet):
    # Handles API requests
```

---

## Why This Architecture?

### Separation of Concerns

- **Frontend**: Handles UI, user interaction, state management
- **Backend**: Handles business logic, database, API processing

### Benefits

✅ **Independent Development**: Frontend and backend can be developed separately
✅ **Scalability**: Can scale frontend and backend independently
✅ **Technology Flexibility**: Can change frontend framework without changing backend
✅ **Security**: Backend can be behind firewall, frontend is public
✅ **Multiple Clients**: Same backend can serve web, mobile, desktop apps

---

## Summary

**Connection Type**: HTTP REST API (JSON over HTTP)

**Configuration**:
- Frontend: `API_BASE_URL` points to backend URL
- Backend: CORS allows frontend to make requests

**Communication**:
- Frontend makes HTTP requests to backend
- Backend returns JSON responses
- No shared code, separate applications

**Files**:
- Frontend: `src/utils/api.ts` (API client)
- Backend: `exams/views.py` (API endpoints)
- Backend: `aws_exam_backend/settings.py` (CORS config)

**Result**: Frontend and backend communicate seamlessly via HTTP API calls! 🚀

