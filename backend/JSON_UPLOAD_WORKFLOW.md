# JSON File Upload Workflow Guide

This guide explains how to upload question JSON files through the Django Admin dashboard.

## Overview

The JSON upload feature allows you to bulk import questions into the database directly from the Django Admin interface. This is useful when you have pre-prepared questions in JSON format and want to load them into the system.

## Prerequisites

1. **Django Admin Access**: You need to be logged in as a superuser or staff member
2. **JSON File**: A properly formatted JSON file containing questions
3. **Exam Created**: The exam must already exist in the database

## Step-by-Step Workflow

### Step 1: Prepare Your JSON File

Create a JSON file with your questions following this format:

```json
[
  {
    "question_text": "What is AWS S3?",
    "domain": "S3",
    "difficulty": "easy",
    "explanation": "S3 is Amazon's object storage service.",
    "correct_answer_letter": "A",
    "options": [
      {"letter": "A", "text": "Object storage service"},
      {"letter": "B", "text": "Database service"},
      {"letter": "C", "text": "Compute service"},
      {"letter": "D", "text": "Networking service"}
    ]
  },
  {
    "question_text": "Which service provides serverless compute?",
    "domain": "Lambda",
    "difficulty": "medium",
    "explanation": "AWS Lambda is a serverless compute service.",
    "correct_answer_letter": "B",
    "options": [
      {"letter": "A", "text": "EC2"},
      {"letter": "B", "text": "Lambda"},
      {"letter": "C", "text": "ECS"},
      {"letter": "D", "text": "Elastic Beanstalk"}
    ]
  }
]
```

**Required Fields:**
- `question_text` (string) - The question text
- `options` (array) - Array of answer options (minimum 1, maximum 4)

**Optional Fields:**
- `domain` (string) - AWS service domain (e.g., "S3", "EC2", "Lambda")
- `difficulty` (string) - "easy", "medium", or "hard" (defaults to "medium")
- `explanation` (string) - Explanation of the correct answer
- `correct_answer_letter` (string) - Letter of correct answer (defaults to "A")

**Note:** You can also use `answers` instead of `options` - both formats are supported.

### Step 2: Access Django Admin

1. Start your Django development server:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000/admin/
   ```

3. Log in with your superuser credentials

### Step 3: Navigate to Exams

1. In the Django Admin homepage, find the **EXAMS** section
2. Click on **Exams** to view the list of all exams
3. You'll see a table with columns:
   - Name
   - Exam type
   - Total questions
   - **Questions** (current count)
   - Is active
   - Created at
   - **Upload Questions** (button column)

### Step 4: Upload JSON File

You have two ways to access the upload page:

#### Option A: From Exam List View
1. In the Exams list, find the exam you want to upload questions for
2. Click the **"Upload JSON"** button in the "Upload Questions" column
3. You'll be taken to the upload page

#### Option B: From Exam Detail View
1. Click on an exam name to open its detail page
2. Look for the upload link in the page (if available)
3. Or use the URL: `/admin/exams/exam/{exam_id}/upload-json/`

### Step 5: Upload Form Page

The upload page displays:

1. **Current Status Section** (gray box):
   - Exam name
   - Current question count
   - Exam type

2. **JSON File Format Section** (yellow box):
   - Example JSON structure
   - Format guidelines

3. **Upload Form**:
   - **JSON File** field: Click "Choose File" to select your JSON file
   - **Replace existing questions** checkbox:
     - ✅ Checked: Deletes all existing questions before loading new ones
     - ☐ Unchecked: Adds new questions, skips duplicates

4. **Tips Section** (blue box):
   - Important notes about the upload process

### Step 6: Select and Upload

1. Click **"Choose File"** button
2. Navigate to your JSON file location
3. Select the file (must have `.json` extension)
4. (Optional) Check **"Replace existing questions"** if you want to replace all questions
5. Click **"Upload and Load Questions"** button

### Step 7: Processing

The system will:

1. **Validate** the JSON file format
2. **Parse** the JSON content
3. **Check** each question for duplicates (by `question_text`)
4. **Create** questions and answers in the database
5. **Update** the exam's `total_questions` field automatically

### Step 8: View Results

After processing, you'll see:

1. **Success Messages** (green):
   - Number of questions successfully loaded
   - Number of duplicates skipped
   - Total questions updated

2. **Warning Messages** (yellow):
   - Any errors encountered (if some questions failed)
   - First few error details

3. **Info Messages** (blue):
   - If `total_questions` was updated

4. **Error Messages** (red):
   - Invalid JSON format
   - Missing required fields
   - Other processing errors

### Step 9: Verify Upload

1. You'll be redirected back to the exam detail page
2. Check the **Questions** count - it should reflect the new total
3. Click on **Questions** in the admin to view individual questions
4. Verify that questions and answers were created correctly

### Step 10: Test in Frontend

1. Start your frontend application
2. Navigate to the exam page
3. Click on the exam you uploaded questions for
4. The questions should now be available and load from the database

## Workflow Diagram

```
┌─────────────────┐
│ Prepare JSON    │
│ File            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Access Django   │
│ Admin           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Navigate to     │
│ Exams Section   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click "Upload   │
│ JSON" Button    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Select JSON     │
│ File            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Choose Options  │
│ (Replace?)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Click Upload    │
│ Button          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ System          │
│ Processes File  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ View Results    │
│ & Verify        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Test in         │
│ Frontend        │
└─────────────────┘
```

## Important Notes

### Duplicate Handling
- Questions with the same `question_text` are automatically skipped
- If you want to replace questions, check "Replace existing questions"
- Duplicate detection is case-sensitive

### Validation Rules
- Each question must have `question_text`
- Each question must have at least one option
- Maximum 4 options per question (additional options are ignored)
- `correct_answer_letter` must match one of the option letters
- `difficulty` must be "easy", "medium", or "hard" (defaults to "medium")

### Error Handling
- Invalid JSON format: Shows specific JSON parsing error
- Missing fields: Lists which questions failed and why
- Partial success: Some questions may load while others fail
- All errors are logged and displayed to the user

### Best Practices

1. **Test with Small Files First**: Start with 5-10 questions to verify format
2. **Backup Before Replace**: If replacing questions, export existing ones first
3. **Validate JSON**: Use a JSON validator before uploading
4. **Check Format**: Ensure all required fields are present
5. **Review Results**: Always check the success/error messages after upload

## Example JSON File

See `backend/exams/sample_questions.json` for a complete example with 5 sample questions.

## Troubleshooting

### "Invalid JSON file" Error
- Check that your file is valid JSON
- Use a JSON validator online
- Ensure proper commas and brackets

### "No options provided" Error
- Ensure each question has an `options` array
- Check that options array is not empty

### "Missing question_text" Error
- Every question must have a `question_text` field
- Check for typos in field names

### Questions Not Appearing
- Check if duplicates were skipped
- Verify the exam ID matches
- Check the Questions count in admin
- Refresh the frontend

### Upload Button Not Visible
- Ensure you're logged in as superuser
- Check that the exam exists
- Verify admin.py is properly configured

## API Integration

After uploading questions via JSON:

1. Questions are immediately available via API:
   - `GET /api/exams/{id}/random-questions/?limit=65`
   - `GET /api/exams/{id}/questions/`

2. Frontend automatically fetches questions when users click exams

3. No need to restart the server - changes are immediate

## Next Steps

After successful upload:
- Questions are ready to use immediately
- Frontend will fetch them automatically
- You can upload more questions anytime
- Mix JSON uploads with AI-generated questions












