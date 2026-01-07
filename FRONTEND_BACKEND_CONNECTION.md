# Frontend-Backend Connection Configuration

## Overview

This document explains how the frontend (React/Vite) and backend (Django REST API) are connected in your architecture.

## Architecture Diagram

```
┌─────────────────────────────┐
│   Frontend (React/Vite)     │
│   Render Static Site        │
│   https://aws-exam-frontend │
│        .onrender.com        │
└──────────────┬──────────────┘
               │
               │ HTTP/HTTPS API Calls
               │ (VITE_API_BASE_URL)
               │
               ▼
┌─────────────────────────────┐
│   Backend (Django API)      │
│   Render Web Service        │
│   https://aws-exam-backend  │
│        .onrender.com        │
│                             │
│   CORS allows:              │
│   - Frontend URL            │
│   - FRONTEND_URL env var    │
└─────────────────────────────┘
```

---

## Configuration Components

### 1. Frontend → Backend Connection

#### A. API Base URL Configuration

**File**: `typescript_simplified_app_with_timer/src/utils/api.ts`

```typescript
// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**How it works:**
- Frontend reads `VITE_API_BASE_URL` environment variable
- If not set, defaults to `http://localhost:8000/api` (local development)
- All API calls use this base URL

**Example API calls:**
```typescript
// Uses API_BASE_URL automatically
fetch(`${API_BASE_URL}/exams/by-type/solutions_architect/`)
// Becomes: https://aws-exam-backend.onrender.com/api/exams/by-type/solutions_architect/
```

#### B. Environment Variable (Render)

**File**: `render.yaml` (lines 42-48)

```yaml
  # Frontend React App
  - type: web
    name: aws-exam-frontend
    envVars:
      - key: VITE_API_BASE_URL
        fromService:
          type: web
          name: aws-exam-backend
          property: host
          suffix: /api
```

**What this does:**
- Automatically sets `VITE_API_BASE_URL` to backend URL + `/api`
- Example: `https://aws-exam-backend.onrender.com/api`
- **Automatically linked** - no manual configuration needed!

**In Render Dashboard:**
- This environment variable is automatically set during deployment
- Updates automatically if backend URL changes

---

### 2. Backend → Frontend Connection (CORS)

#### A. CORS Configuration

**File**: `backend/aws_exam_backend/settings.py` (lines 145-165)

```python
# CORS Settings
if DEBUG:
    # Development: Allow all origins
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
else:
    # Production: Allow Render frontend URL
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "https://aws-exam-frontend.onrender.com",
        os.getenv('FRONTEND_URL', ''),  # Allow custom frontend URL via env var
    ]
    # Filter out empty strings
    CORS_ALLOWED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS if origin]
```

**What this does:**
- **Development**: Allows all origins (for local development)
- **Production**: Only allows specific frontend URLs
- Prevents CORS errors when frontend calls backend

#### B. Frontend URL Environment Variable (Render)

**File**: `render.yaml` (lines 28-32)

```yaml
  # Backend Django API
  - type: web
    name: aws-exam-backend
    envVars:
      - key: FRONTEND_URL
        fromService:
          type: web
          name: aws-exam-frontend
          property: host
```

**What this does:**
- Automatically sets `FRONTEND_URL` to frontend service URL
- Example: `https://aws-exam-frontend.onrender.com`
- Used in Django CORS settings to allow frontend requests
- **Automatically linked** - no manual configuration needed!

---

## Complete Connection Flow

### 1. Render Deployment

When you deploy via `render.yaml`:

1. **Render creates backend service** → `https://aws-exam-backend.onrender.com`
2. **Render creates frontend service** → `https://aws-exam-frontend.onrender.com`
3. **Render automatically links services:**
   - Sets `VITE_API_BASE_URL` in frontend = `https://aws-exam-backend.onrender.com/api`
   - Sets `FRONTEND_URL` in backend = `https://aws-exam-frontend.onrender.com`

### 2. Frontend Makes API Call

```typescript
// User clicks exam type
const apiQuestions = await getOrGenerateExamQuestions('solutions_architect', 50);

// Frontend code (api.ts) uses API_BASE_URL
fetch(`${API_BASE_URL}/exams/by-type/solutions_architect/`)

// Resolves to:
fetch('https://aws-exam-backend.onrender.com/api/exams/by-type/solutions_architect/')
```

### 3. Backend Receives Request

1. **Request arrives** at `https://aws-exam-backend.onrender.com/api/exams/...`
2. **CORS middleware checks origin**:
   - Origin: `https://aws-exam-frontend.onrender.com`
   - Allowed? Yes (in `CORS_ALLOWED_ORIGINS`)
3. **Request processed** and response sent
4. **Response includes CORS headers**:
   - `Access-Control-Allow-Origin: https://aws-exam-frontend.onrender.com`
   - `Access-Control-Allow-Credentials: true`

### 4. Frontend Receives Response

1. Browser receives response with CORS headers
2. CORS check passes (origin is allowed)
3. Frontend processes data
4. Questions displayed to user

---

## Configuration Files

### Frontend Configuration

#### 1. `typescript_simplified_app_with_timer/src/utils/api.ts`

```typescript
// API Base URL - reads from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

**Purpose**: Defines where to send API requests

**Development**: Defaults to `http://localhost:8000/api`
**Production**: Uses `VITE_API_BASE_URL` from Render

#### 2. `render.yaml` (Frontend Section)

```yaml
  # Frontend React App
  - type: web
    name: aws-exam-frontend
    envVars:
      - key: VITE_API_BASE_URL
        fromService:
          type: web
          name: aws-exam-backend
          property: host
          suffix: /api
```

**Purpose**: Automatically sets backend URL in frontend

**How it works**:
- `fromService`: References another Render service
- `name: aws-exam-backend`: The backend service name
- `property: host`: Gets the service URL
- `suffix: /api`: Appends `/api` to the URL

**Result**: `VITE_API_BASE_URL = https://aws-exam-backend.onrender.com/api`

---

### Backend Configuration

#### 1. `backend/aws_exam_backend/settings.py`

```python
# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "https://aws-exam-frontend.onrender.com",
    os.getenv('FRONTEND_URL', ''),
]
```

**Purpose**: Allows frontend to make requests to backend

**Development**: Allows all origins (`CORS_ALLOW_ALL_ORIGINS = True`)
**Production**: Only allows specific frontend URLs

#### 2. `render.yaml` (Backend Section)

```yaml
  # Backend Django API
  - type: web
    name: aws-exam-backend
    envVars:
      - key: FRONTEND_URL
        fromService:
          type: web
          name: aws-exam-frontend
          property: host
```

**Purpose**: Automatically sets frontend URL in backend

**How it works**:
- `fromService`: References another Render service
- `name: aws-exam-frontend`: The frontend service name
- `property: host`: Gets the service URL

**Result**: `FRONTEND_URL = https://aws-exam-frontend.onrender.com`

---

## Environment Variables Reference

### Frontend Environment Variables

| Variable | Purpose | Value | Source |
|----------|---------|-------|--------|
| `VITE_API_BASE_URL` | Backend API URL | `https://aws-exam-backend.onrender.com/api` | `render.yaml` (auto) |

**In Render Dashboard:**
- Go to Frontend Service → Environment
- Variable is automatically set from `render.yaml`

**For Local Development:**
Create `.env` file in `typescript_simplified_app_with_timer/`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend Environment Variables

| Variable | Purpose | Value | Source |
|----------|---------|-------|--------|
| `FRONTEND_URL` | Frontend URL for CORS | `https://aws-exam-frontend.onrender.com` | `render.yaml` (auto) |

**In Render Dashboard:**
- Go to Backend Service → Environment
- Variable is automatically set from `render.yaml`

**For Local Development:**
No need - CORS allows all origins in development mode

---

## Service Linking in Render

### Automatic Service Linking

**File**: `render.yaml`

Render automatically links services using the `fromService` property:

```yaml
envVars:
  - key: VITE_API_BASE_URL
    fromService:
      type: web          # Service type
      name: aws-exam-backend  # Service name
      property: host     # Get the service URL
      suffix: /api       # Optional suffix
```

**Benefits:**
- ✅ No manual URL configuration needed
- ✅ Automatically updates if service URL changes
- ✅ Links services together seamlessly
- ✅ Works across environments

### Manual Configuration (Alternative)

If not using `render.yaml` or need manual configuration:

#### In Render Dashboard:

**Frontend Service → Environment Variables:**
```
Key: VITE_API_BASE_URL
Value: https://aws-exam-backend.onrender.com/api
```

**Backend Service → Environment Variables:**
```
Key: FRONTEND_URL
Value: https://aws-exam-frontend.onrender.com
```

---

## Local Development Configuration

### Frontend Local Development

**File**: `typescript_simplified_app_with_timer/.env` (create if needed)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Default**: Already defaults to `http://localhost:8000/api` in `api.ts`

### Backend Local Development

**No configuration needed** - CORS allows all origins in development:

```python
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # Allows all origins
```

---

## Testing the Connection

### 1. Check Frontend Environment Variable

**In Browser Console** (on frontend):
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
// Should show: https://aws-exam-backend.onrender.com/api
```

### 2. Test API Connection

**In Browser Console** (on frontend):
```javascript
fetch('https://aws-exam-backend.onrender.com/api/exams/')
  .then(r => r.json())
  .then(data => console.log('✅ Connected:', data))
  .catch(err => console.error('❌ Error:', err));
```

### 3. Check CORS Headers

**In Browser DevTools → Network Tab:**
- Select an API request
- Check Response Headers:
  - `Access-Control-Allow-Origin: https://aws-exam-frontend.onrender.com`
  - `Access-Control-Allow-Credentials: true`

### 4. Verify Backend Environment Variable

**Via Render Shell** (backend service):
```bash
echo $FRONTEND_URL
# Should show: https://aws-exam-frontend.onrender.com
```

**Via Django Shell:**
```python
from django.conf import settings
import os
print(os.getenv('FRONTEND_URL'))
```

---

## Troubleshooting

### CORS Errors

**Error**: `Access-Control-Allow-Origin` header missing

**Solutions:**
1. Verify `FRONTEND_URL` is set in backend environment
2. Check `CORS_ALLOWED_ORIGINS` includes frontend URL
3. Verify frontend URL matches exactly (including `https://`)
4. Rebuild backend after changing CORS settings
5. Clear browser cache

### Frontend Can't Reach Backend

**Error**: Network error or connection refused

**Solutions:**
1. Verify `VITE_API_BASE_URL` is set in frontend environment
2. Check backend URL is correct (no typos)
3. **Rebuild frontend** (env vars embedded at build time)
4. Verify backend is running on Render
5. Test backend URL directly in browser

### Environment Variables Not Set

**Problem**: Variables not showing up in Render

**Solutions:**
1. Check `render.yaml` syntax is correct
2. Verify service names match exactly
3. Re-deploy services to apply changes
4. Check Render logs for errors

### Service Linking Not Working

**Problem**: `fromService` not resolving

**Solutions:**
1. Verify services are deployed in correct order
2. Check service names match exactly in `render.yaml`
3. Ensure both services are in the same Render account
4. Re-deploy using Blueprint (auto-detects `render.yaml`)

---

## Summary

### Connection Components

1. **Frontend → Backend**:
   - `VITE_API_BASE_URL` environment variable (auto-set via `render.yaml`)
   - All API calls use this base URL

2. **Backend → Frontend (CORS)**:
   - `FRONTEND_URL` environment variable (auto-set via `render.yaml`)
   - CORS settings allow frontend URL

3. **Automatic Linking**:
   - `render.yaml` uses `fromService` to link services
   - No manual configuration needed
   - Updates automatically

### Key Files

| File | Purpose |
|------|---------|
| `typescript_simplified_app_with_timer/src/utils/api.ts` | Frontend API base URL |
| `backend/aws_exam_backend/settings.py` | Backend CORS configuration |
| `render.yaml` | Service linking configuration |

### Key Configuration Points

✅ **Frontend**: `VITE_API_BASE_URL` → Backend URL + `/api`
✅ **Backend**: `FRONTEND_URL` → Frontend URL (for CORS)
✅ **Render**: Automatic service linking via `render.yaml`
✅ **CORS**: Allows frontend to make requests to backend

**Result**: Seamless connection between frontend and backend with automatic configuration!


