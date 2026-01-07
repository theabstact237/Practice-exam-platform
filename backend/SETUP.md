# Django Backend Setup Guide

This guide will help you set up and run the Django backend for the AWS Exam Platform.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

## Step-by-Step Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

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

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
DJANGO_SECRET_KEY=your-secret-key-here-change-in-production
OPENAI_API_KEY=sk-your-openai-api-key-here
# Optional: Manus API
MANUS_API_KEY=your-manus-api-key
MANUS_API_URL=https://api.manus.ai/v1
```

**To generate a Django secret key:**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5. Run Database Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Initial Exams

This command creates the AWS Solutions Architect and Cloud Practitioner exam records:

```bash
python manage.py create_exams
```

### 7. Create Superuser (Optional, for Django Admin)

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### 8. Run Development Server

```bash
python manage.py runserver
```

The server will start on `http://localhost:8000`

- API: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`

## Frontend Integration

### Update Frontend Environment

Create a `.env` file in `typescript_simplified_app_with_timer/` directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Test the Connection

1. Start Django backend: `python manage.py runserver`
2. Start frontend: `npm run dev` (in `typescript_simplified_app_with_timer/`)
3. Navigate to the exam page
4. Select an exam type
5. Questions will be generated automatically on first load

## Generating Questions

### Via API (Automatic)

When a user selects an exam type in the frontend:
1. Frontend calls `/api/exams/by-type/{exam_type}/`
2. If no questions exist, frontend calls `/api/exams/{id}/generate-questions/`
3. Questions are generated using OpenAI/Manus API
4. Questions are saved to the database
5. Questions are returned to the frontend

### Via Django Admin

1. Go to `http://localhost:8000/admin/`
2. Login with your superuser credentials
3. Navigate to **Exams** → Select an exam
4. Use the **Generate Questions** action (if implemented) or use the API endpoint manually

### Via API Endpoint Directly

**POST** `/api/exams/{exam_id}/generate-questions/`

```json
{
  "num_questions": 50,
  "domain": "EC2",
  "use_manus": false
}
```

## API Endpoints

### Exams

- `GET /api/exams/` - List all exams
- `GET /api/exams/{id}/` - Get exam with questions
- `GET /api/exams/by-type/{exam_type}/` - Get exams by type
- `GET /api/exams/{id}/questions/` - Get questions for an exam
- `POST /api/exams/{id}/generate-questions/` - Generate questions

### Questions

- `GET /api/questions/` - List all questions
- `GET /api/questions/{id}/` - Get specific question

## Troubleshooting

### CORS Issues

If you see CORS errors:
1. Check `settings.py` - ensure `corsheaders` is in `INSTALLED_APPS`
2. Verify `CORS_ALLOWED_ORIGINS` includes your frontend URL
3. For development, `CORS_ALLOW_ALL_ORIGINS = True` when `DEBUG = True`

### OpenAI API Errors

- Verify your API key in `.env`
- Check your OpenAI account has credits
- Ensure internet connectivity

### Database Issues

- Run migrations: `python manage.py migrate`
- If issues persist, delete `db.sqlite3` and run migrations again

### Port Already in Use

Change the port:
```bash
python manage.py runserver 8001
```

And update frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:8001/api
```

## Production Deployment

For production:

1. Set `DEBUG = False` in `settings.py`
2. Use a production database (PostgreSQL recommended)
3. Set secure `DJANGO_SECRET_KEY`
4. Configure proper CORS origins
5. Use environment variables for all secrets
6. Set up static file serving
7. Use a production WSGI server (Gunicorn/uWSGI)

## Next Steps

1. Generate questions for your exams using the API or admin
2. Test the frontend integration
3. Monitor question quality and adjust prompts if needed
4. Set up database backups
5. Consider implementing question caching to reduce API calls


