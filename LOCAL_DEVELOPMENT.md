# Local Development Guide

This guide will help you run both the frontend and backend locally on your machine.

## Prerequisites

- ✅ Python 3.8+ (You have 3.12.4)
- ✅ Node.js 18+ 
- ✅ npm (Node package manager)
- ✅ Virtual environment for Python (recommended)

---

## Quick Start

### Terminal 1: Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py create_exams
python manage.py runserver
```

Backend will run on: **http://localhost:8000**

### Terminal 2: Frontend (React/Vite)

```bash
cd typescript_simplified_app_with_timer
npm install
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## Step-by-Step Setup

### Part 1: Backend Setup

#### Step 1: Navigate to Backend Directory

```bash
cd backend
```

#### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

#### Step 4: Create Environment Variables (Optional)

Create a `.env` file in the `backend` directory:

```env
DJANGO_SECRET_KEY=your-secret-key-here-for-local-dev
OPENAI_API_KEY=your-openai-api-key-here
MANUS_API_KEY=your-manus-api-key-here (optional)
DEBUG=True
```

**Generate Django Secret Key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

#### Step 5: Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

#### Step 6: Create Initial Exams

```bash
python manage.py create_exams
```

#### Step 7: (Optional) Create Superuser for Django Admin

```bash
python manage.py createsuperuser
```

#### Step 8: Start Django Development Server

```bash
python manage.py runserver
```

**Backend is now running at: http://localhost:8000**
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

---

### Part 2: Frontend Setup

#### Step 1: Navigate to Frontend Directory

Open a **new terminal window** (keep backend running):

```bash
cd typescript_simplified_app_with_timer
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Create Environment Variables (Optional)

Create a `.env` file in the `typescript_simplified_app_with_timer` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**Note**: The frontend already defaults to `http://localhost:8000/api` if this variable is not set.

#### Step 4: Start Development Server

```bash
npm run dev
```

**Frontend is now running at: http://localhost:5173**

---

## Verify Everything Works

### 1. Test Backend API

Open browser and visit:
- **API Health**: http://localhost:8000/api/exams/
- **Django Admin**: http://localhost:8000/admin/

You should see JSON data from the API.

### 2. Test Frontend

Open browser and visit:
- **Frontend**: http://localhost:5173

You should see the AWS Exam Platform.

### 3. Test Connection

1. Open http://localhost:5173 in browser
2. Open browser DevTools (F12) → Console tab
3. Select an exam type
4. Check for any errors in console
5. Verify questions load from backend

---

## Troubleshooting

### Backend Issues

#### Port 8000 Already in Use

```bash
# Use a different port
python manage.py runserver 8001
```

Then update frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8001/api
```

#### Module Not Found Errors

```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

#### Database Errors

```bash
# Delete database and recreate
# Windows
del db.sqlite3
# Linux/Mac
rm db.sqlite3

# Run migrations again
python manage.py migrate
python manage.py create_exams
```

#### Missing Environment Variables

Create `.env` file in `backend/` directory with at least:
```env
DEBUG=True
```

### Frontend Issues

#### Port 5173 Already in Use

Vite will automatically try the next available port (5174, 5175, etc.)

Or specify a port:
```bash
npm run dev -- --port 3000
```

#### Module Not Found Errors

```bash
# Delete node_modules and reinstall
rm -rf node_modules  # Linux/Mac
rmdir /s node_modules  # Windows
npm install
```

#### API Connection Errors

1. Verify backend is running on http://localhost:8000
2. Check `VITE_API_BASE_URL` in `.env` file
3. Test backend directly: http://localhost:8000/api/exams/
4. Check CORS settings (should allow all origins in development)

#### CORS Errors

The backend should automatically allow all origins in development mode (`DEBUG=True`).

Check `backend/aws_exam_backend/settings.py`:
```python
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True  # Should be True for local dev
```

---

## Development Workflow

### Typical Development Session

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend
   venv\Scripts\activate  # Windows
   python manage.py runserver
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd typescript_simplified_app_with_timer
   npm run dev
   ```

3. **Make Changes**:
   - Backend changes: Auto-reloads (Django development server)
   - Frontend changes: Hot reloads (Vite HMR)

4. **Test Changes**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/

### Stopping Servers

- **Backend**: Press `Ctrl+C` in backend terminal
- **Frontend**: Press `Ctrl+C` in frontend terminal

---

## Environment Configuration

### Backend Environment Variables

**File**: `backend/.env`

```env
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-for-local-dev
DEBUG=True

# API Keys
OPENAI_API_KEY=sk-your-openai-api-key
MANUS_API_KEY=your-manus-api-key (optional)

# Database (optional - uses SQLite by default locally)
# DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

### Frontend Environment Variables

**File**: `typescript_simplified_app_with_timer/.env`

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000/api
```

**Note**: Frontend already defaults to `http://localhost:8000/api` if variable is not set.

---

## Common Commands

### Backend Commands

```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Run server
python manage.py runserver

# Run on different port
python manage.py runserver 8001

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create exams
python manage.py create_exams

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Collect static files
python manage.py collectstatic
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start on specific port
npm run dev -- --port 3000
```

---

## Database Management

### Using SQLite (Default for Local Development)

The backend uses SQLite by default for local development:
- **Database file**: `backend/db.sqlite3`
- **No setup required**: Created automatically on first migration

### Using PostgreSQL (Optional)

If you want to use PostgreSQL locally:

1. Install PostgreSQL
2. Create database
3. Update `backend/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/aws_exam_db
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```

---

## Accessing Django Admin

1. Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

2. Start backend server:
   ```bash
   python manage.py runserver
   ```

3. Visit: http://localhost:8000/admin/
4. Login with superuser credentials

---

## API Testing

### Using Browser

Visit these URLs to test API:

- **List Exams**: http://localhost:8000/api/exams/
- **Exams by Type**: http://localhost:8000/api/exams/by-type/solutions_architect/
- **Questions**: http://localhost:8000/api/exams/1/questions/?limit=50

### Using curl

```bash
# List exams
curl http://localhost:8000/api/exams/

# Get random questions
curl http://localhost:8000/api/exams/1/random-questions/?limit=50
```

### Using Browser Console

Open http://localhost:5173, then in browser console:

```javascript
// Test API connection
fetch('http://localhost:8000/api/exams/')
  .then(r => r.json())
  .then(data => console.log('✅ API Connected:', data))
  .catch(err => console.error('❌ Error:', err));
```

---

## Next Steps

1. ✅ Backend running on http://localhost:8000
2. ✅ Frontend running on http://localhost:5173
3. ✅ Test the connection
4. ✅ Start developing!

---

## Tips

- **Hot Reload**: Both frontend and backend auto-reload on file changes
- **Separate Terminals**: Keep backend and frontend in separate terminal windows
- **Environment Variables**: Use `.env` files for local development
- **Database**: SQLite is fine for local development
- **CORS**: Automatically configured for local development

---

## Summary

**Backend**: http://localhost:8000
**Frontend**: http://localhost:5173
**Admin**: http://localhost:8000/admin/

Both services run independently and communicate via HTTP API calls!

