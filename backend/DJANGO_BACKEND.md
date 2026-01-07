# Django Backend Integration Guide

## Overview

The Django backend has been successfully integrated with your React frontend. This document explains how the integration works and how to use it.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   React Frontend│────────▶│   Django REST API│────────▶│   Database  │
│                 │◀────────│                  │◀────────│             │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  OpenAI/Manus API│
                            │  (Question Gen)  │
                            └──────────────────┘
```

## How It Works

### 1. User Selects Exam Type

When a user clicks on an exam menu (e.g., "AWS Solutions Architect"):

1. Frontend calls `getOrGenerateExamQuestions(examType)`
2. API checks if exam exists in database
3. If no questions exist, generates them using AI API
4. Questions are saved to database
5. Questions are returned to frontend

### 2. Question Generation Flow

```
User clicks exam → Frontend requests questions → Backend checks DB
→ No questions found → Backend calls OpenAI/Manus API
→ Questions generated → Saved to database → Returned to frontend
```

### 3. Database Models

#### Exam Model
- Represents different AWS certification exams
- Stores exam metadata (name, type, time limit, passing score)
- Each exam has many questions

#### Question Model
- Stores question text, domain, difficulty
- Each question has one correct answer and multiple options
- Linked to an Exam via foreign key

#### Answer Model
- Stores multiple choice options (A, B, C, D)
- One answer per question is marked as correct
- Linked to Question via foreign key

## API Endpoints

### Frontend → Backend

#### Get or Generate Questions
**Function:** `getOrGenerateExamQuestions(examType, numQuestions, useManus)`

**Flow:**
1. `GET /api/exams/by-type/{exam_type}/` - Get exam by type
2. If no questions: `POST /api/exams/{id}/generate-questions/`
3. `GET /api/exams/{id}/questions/` - Get questions

#### Generate Questions Endpoint
**POST** `/api/exams/{id}/generate-questions/`

**Request Body:**
```json
{
  "num_questions": 50,
  "domain": "EC2",  // optional
  "use_manus": false  // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 50 new questions for AWS Solutions Architect",
  "created_count": 50,
  "requested_count": 50
}
```

## Configuration

### Backend Configuration

**File:** `backend/aws_exam_backend/settings.py`

- `CORS_ALLOWED_ORIGINS`: Frontend URLs allowed to access API
- `OPENAI_API_KEY`: OpenAI API key (from environment)
- `MANUS_API_KEY`: Manus API key (from environment)

### Frontend Configuration

**File:** `typescript_simplified_app_with_timer/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**File:** `typescript_simplified_app_with_timer/src/utils/api.ts`

- `API_BASE_URL`: Base URL for API calls (defaults to localhost:8000)

## Quick Start

### 1. Setup Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python manage.py migrate
python manage.py create_exams
python manage.py createsuperuser  # Optional
python manage.py runserver
```

### 2. Setup Frontend

```bash
cd typescript_simplified_app_with_timer
npm install
# Create .env file with VITE_API_BASE_URL=http://localhost:8000/api
npm run dev
```

### 3. Test Integration

1. Open frontend at `http://localhost:5173`
2. Click on an exam type (e.g., "AWS Solutions Architect")
3. First time: Questions will be generated automatically
4. Subsequent times: Questions loaded from database

## Question Generation

### OpenAI Integration

The backend uses OpenAI's GPT-4o-mini model to generate questions.

**Prompt Structure:**
- Exam name and type
- Number of questions requested
- Domain filter (optional)
- Format: JSON array with questions, options, correct answers, explanations

### Manus API Integration

If `use_manus=true` is passed, the backend will use Manus API instead.

**Configuration:**
- Set `MANUS_API_KEY` in `.env`
- Set `MANUS_API_URL` in `.env` (defaults to https://api.manus.ai/v1)

### Generating Questions Manually

#### Via Django Admin

1. Go to `http://localhost:8000/admin/`
2. Navigate to **Exams** → Select an exam
3. Use the API endpoint or create questions manually

#### Via API Directly

```bash
curl -X POST http://localhost:8000/api/exams/1/generate-questions/ \
  -H "Content-Type: application/json" \
  -d '{"num_questions": 50, "domain": "EC2"}'
```

## Database Management

### Django Admin Dashboard

Access at `http://localhost:8000/admin/`

**Features:**
- View and edit exams, questions, answers
- Filter by exam type, domain, difficulty
- Search questions
- Bulk actions

### Creating Initial Data

**Create Exams:**
```bash
python manage.py create_exams
```

This creates:
- AWS Solutions Architect exam
- AWS Cloud Practitioner exam

## Troubleshooting

### Frontend Can't Connect to Backend

**Error:** `Failed to fetch` or CORS errors

**Solution:**
1. Ensure backend is running: `python manage.py runserver`
2. Check `CORS_ALLOWED_ORIGINS` in `settings.py`
3. Verify `VITE_API_BASE_URL` in frontend `.env`

### Questions Not Generating

**Error:** `No AI API configured`

**Solution:**
1. Check `.env` file has `OPENAI_API_KEY` or `MANUS_API_KEY`
2. Verify API key is valid
3. Check internet connectivity
4. Ensure OpenAI account has credits

### Database Errors

**Error:** `no such table` or migration errors

**Solution:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### Questions Not Appearing in Frontend

**Check:**
1. Backend logs for errors
2. Browser console for API errors
3. Network tab for failed requests
4. Ensure questions exist in database (check Django admin)

## Best Practices

### 1. Question Caching

Questions are generated once and stored in the database. This:
- Reduces API costs
- Improves load times
- Ensures consistency

### 2. Error Handling

The frontend has fallback error handling:
- Shows loading state during generation
- Displays error messages if generation fails
- Logs errors for debugging

### 3. API Rate Limiting

Consider implementing rate limiting for:
- Question generation endpoint
- API calls to OpenAI/Manus

### 4. Database Backup

Regularly backup your database:
```bash
python manage.py dumpdata > backup.json
```

## Production Deployment

### Backend

1. Use PostgreSQL instead of SQLite
2. Set `DEBUG = False`
3. Configure proper CORS origins
4. Use environment variables for secrets
5. Set up Gunicorn/uWSGI
6. Configure Nginx as reverse proxy

### Frontend

1. Update `VITE_API_BASE_URL` to production backend URL
2. Build for production: `npm run build`
3. Deploy to Netlify/Vercel/other hosting

## Next Steps

1. ✅ Backend created and configured
2. ✅ Frontend integrated with backend
3. ✅ Question generation working
4. 🔄 Test with real users
5. 🔄 Monitor API costs
6. 🔄 Improve question quality with better prompts
7. 🔄 Add question validation/quality checks
8. 🔄 Implement question versioning

## Support

For issues or questions:
1. Check Django logs: `python manage.py runserver`
2. Check browser console for frontend errors
3. Review API responses in Network tab
4. Check database state in Django admin


