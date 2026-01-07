# AWS Exam Backend - Django API

Django REST API backend for managing AWS certification exam questions with AI-powered question generation.

## Features

- 🎯 Django REST Framework API
- 🤖 AI-powered question generation (OpenAI/Manus API)
- 📊 Django Admin dashboard for database management
- 🗄️ SQLite database (easily configurable to PostgreSQL)
- 🔄 CORS configured for frontend integration
- 📝 Comprehensive exam, question, and answer models

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
DJANGO_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=sk-your-openai-api-key
MANUS_API_KEY=your-manus-api-key  # Optional
MANUS_API_URL=https://api.manus.ai/v1  # Optional
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (for Django Admin)

```bash
python manage.py createsuperuser
```

### 7. Run Development Server

```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`
Django Admin will be available at: `http://localhost:8000/admin/`

## API Endpoints

### Exams

- `GET /api/exams/` - List all exams
- `GET /api/exams/{id}/` - Get specific exam with questions
- `POST /api/exams/` - Create new exam
- `PUT /api/exams/{id}/` - Update exam
- `DELETE /api/exams/{id}/` - Delete exam
- `GET /api/exams/{id}/questions/` - Get all questions for an exam
- `POST /api/exams/{id}/generate-questions/` - Generate questions using AI
- `GET /api/exams/by-type/{exam_type}/` - Get exams by type

### Questions

- `GET /api/questions/` - List all questions
- `GET /api/questions/{id}/` - Get specific question

### Generate Questions Endpoint

**POST** `/api/exams/{id}/generate-questions/`

**Body:**
```json
{
    "num_questions": 50,
    "domain": "EC2",  // optional
    "use_manus": false  // optional, defaults to OpenAI
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

## Django Admin

Access the admin dashboard at `http://localhost:8000/admin/` to:

- Manage exams, questions, and answers
- View and edit all database records
- Generate questions manually
- Filter and search records

## Database Models

### Exam
- `name`: Exam name (e.g., "AWS Solutions Architect")
- `exam_type`: Type of exam (solutions_architect, cloud_practitioner, etc.)
- `total_questions`: Number of questions in the exam
- `time_limit_minutes`: Time limit for the exam
- `passing_score`: Passing score percentage
- `is_active`: Whether the exam is active

### Question
- `exam`: Foreign key to Exam
- `question_text`: The question text
- `domain`: AWS service domain (e.g., EC2, S3)
- `difficulty`: easy, medium, or hard
- `explanation`: Explanation of the correct answer

### Answer
- `question`: Foreign key to Question
- `letter`: Answer choice letter (A, B, C, D)
- `text`: Answer text
- `is_correct`: Boolean indicating correct answer

## Integration with Frontend

The frontend React app needs to be updated to:

1. Fetch exams from `/api/exams/by-type/{exam_type}/`
2. Fetch questions from `/api/exams/{id}/questions/`
3. Call `/api/exams/{id}/generate-questions/` when user selects an exam (if questions don't exist)

Update the frontend API base URL in your React app to point to `http://localhost:8000/api/`.

## Production Deployment

For production:

1. Set `DEBUG = False` in `settings.py`
2. Use a secure `DJANGO_SECRET_KEY`
3. Configure a production database (PostgreSQL recommended)
4. Set up proper CORS origins
5. Use environment variables for all secrets
6. Set up static file serving
7. Use a production WSGI server (Gunicorn, uWSGI)

## Troubleshooting

### CORS Issues
Make sure `corsheaders` is in `INSTALLED_APPS` and `CorsMiddleware` is in `MIDDLEWARE`.

### OpenAI API Errors
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure you have internet connectivity

### Database Errors
Run migrations: `python manage.py migrate`

## License

This project is part of the AWS Exam Platform.


