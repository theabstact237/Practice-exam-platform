# Resource Optimization - Intelligent Question Pool Enrichment

## Overview

The backend has been optimized with **intelligent enrichment** that randomly enriches the database pool even after reaching 100 questions, keeping the pool fresh and optimized while maintaining cost efficiency.

## How It Works

### Intelligent Question Pool System

1. **Target Pool Size**: 100 questions per exam (baseline)
2. **Pool Growth**: Pool grows beyond 100 through random enrichment
3. **Selection**: Randomly selects 50 questions from the enriched pool
4. **Enrichment**: Intelligently enriches with 15% probability when pool >= 100
5. **Timer**: Each question has a 1 minute 30 seconds (90 seconds) timer

### Flow Diagram

```
User selects exam
    ↓
Check database question count
    ↓
Less than 100? → Always generate (fill to 100)
    ↓
100+ questions? → Intelligent enrichment decision:
    ↓
    15% chance → Generate 10-20 new questions (enrich pool)
    85% chance → Use existing questions (economize resources)
    ↓
Select random 50 questions from enriched pool
    ↓
Return to frontend
```

## Backend Changes

### 1. Random Question Selection Endpoint

**GET** `/api/exams/{id}/random-questions/?limit=50`

- Selects up to 100 random questions from the database pool
- Returns 50 random questions from that pool
- Always returns random order

**Response:**
```json
{
  "questions": [...],
  "count": 50,
  "pool_size": 100,
  "total_available": 150
}
```

### 2. Updated Questions Endpoint

**GET** `/api/exams/{id}/questions/?random=true&limit=50`

- Now supports random selection by default
- Returns 50 random questions from pool of 100

### 3. Intelligent Question Generation & Enrichment

**POST** `/api/exams/{id}/generate-questions/`

- Checks if database has 100+ questions
- **Below 100**: Always generates to fill to target
- **Above 100**: Randomly enriches with 15% probability (configurable)
- **Random Enrichment**: Generates 10-20 questions (smaller batches)
- **Pool Growth**: Pool grows beyond 100 over time
- Returns enrichment details (reason, count, etc.)

**Response when pool is full:**
```json
{
  "success": true,
  "message": "Database already has 100 questions (pool of 100). Using existing questions.",
  "current_count": 100,
  "pool_size": 100,
  "created_count": 0,
  "skipped": true
}
```

### 4. Question Count Tracking

The `by-type` endpoint now includes `questions_count`:

**GET** `/api/exams/by-type/{exam_type}/`

```json
[
  {
    "id": 1,
    "name": "AWS Solutions Architect",
    "questions_count": 100,
    ...
  }
]
```

## Frontend Changes

### Updated API Utility

**File:** `typescript_simplified_app_with_timer/src/utils/api.ts`

1. **`getRandomExamQuestions(examId, limit)`**
   - New function to fetch random questions from pool
   - Returns 50 random questions

2. **`getOrGenerateExamQuestions(examType, numQuestions)`**
   - Updated to check question count first
   - Only generates if count < 100
   - Always returns 50 random questions from pool

### Logic Flow

```typescript
// Check if exam has 100+ questions
if (currentCount < 100) {
  // Generate questions (up to 100)
  await generateExamQuestions(...);
}

// Always fetch 50 random questions from pool
const questions = await getRandomExamQuestions(exam.id, 50);
```

## Benefits

### 1. Resource Economy
- ✅ No API calls once database is populated (100+ questions)
- ✅ Reduces OpenAI/Manus API usage significantly
- ✅ Lower costs

### 2. Performance
- ✅ Faster question loading (no generation wait)
- ✅ Questions cached in database
- ✅ Instant random selection

### 3. User Experience
- ✅ Always gets 50 questions in random order
- ✅ Different questions each exam attempt
- ✅ Consistent 1.5 minute timer per question

## Example Scenarios

### Scenario 1: First Time (Empty Database)
1. User selects exam
2. Database has 0 questions
3. Backend generates 50 questions (always, to fill pool)
4. Returns 50 random questions
5. Pool: 50/100 (target)

### Scenario 2: Partially Populated (50 questions)
1. User selects exam
2. Database has 50 questions
3. Backend generates 50 more questions (always, to reach 100)
4. Returns 50 random questions from pool of 100
5. Pool: 100/100 (target reached)

### Scenario 3: Fully Populated - Random Enrichment (100+ questions)
1. User selects exam
2. Database has 100 questions
3. **Intelligent enrichment decision** (15% probability)
4. If triggered: Generates 10-20 new questions (enriches pool)
5. If not triggered: Uses existing questions
6. Returns 50 random questions from enriched pool
7. Pool: 100+ questions (growing over time)

### Scenario 4: Enriched Pool (120+ questions)
1. User selects exam
2. Database has 120 questions
3. **Intelligent enrichment decision** (15% probability)
4. If triggered: Generates 10-20 more questions
5. Pool grows: 120 → 130-140 questions
6. Returns 50 random questions from enriched pool
7. Over time: Pool continues to grow and optimize

## Configuration

### Pool Size

Default: **100 questions**

To change pool size, update in:
- `backend/exams/views.py`: `pool_size = 100`
- `typescript_simplified_app_with_timer/src/utils/api.ts`: `const poolSize = 100`

### Question Limit

Default: **50 questions per exam**

To change, update:
- `getRandomExamQuestions(examId, limit)` - default 50
- Frontend: `getOrGenerateExamQuestions(examType, numQuestions)` - default 50

### Timer

Default: **90 seconds (1.5 minutes)** per question

Already configured in `App.tsx`:
```typescript
const [timeRemaining, setTimeRemaining] = useState(90); // 1.5 minutes in seconds
```

## Testing

### Test Random Selection

```bash
# Get random 50 questions
curl http://localhost:8000/api/exams/1/random-questions/?limit=50

# Should return different questions each time
```

### Test Generation Limits

```bash
# Try to generate when pool is full (should skip)
curl -X POST http://localhost:8000/api/exams/1/generate-questions/ \
  -H "Content-Type: application/json" \
  -d '{"num_questions": 50}'

# Response should have "skipped": true
```

### Test Force Generation

```bash
# Force generation even if pool is full
curl -X POST http://localhost:8000/api/exams/1/generate-questions/ \
  -H "Content-Type: application/json" \
  -d '{"num_questions": 50, "force": true}'
```

## Monitoring

### Check Question Count

**Via API:**
```bash
curl http://localhost:8000/api/exams/by-type/solutions_architect/
# Check "questions_count" field
```

**Via Django Admin:**
1. Go to `http://localhost:8000/admin/`
2. Navigate to **Exams** → Select an exam
3. View question count in the list

**Via Django Shell:**
```python
from exams.models import Exam

exam = Exam.objects.get(exam_type='solutions_architect')
print(f"Questions: {exam.questions.count()}")
```

## Migration Guide

If you have an existing database with questions:

1. Questions already in database will be used
2. Random selection will work immediately
3. Generation will only happen if count < 100
4. No data migration needed

## Troubleshooting

### Questions not randomizing

- Check that database has 100+ questions
- Verify `random=true` parameter in requests
- Clear browser cache

### Generation still happening

- Check database question count: `exam.questions.count()`
- Verify pool size configuration
- Check if `force=true` is being sent

### Different questions expected

- Random selection is truly random
- Each request may return different questions
- This is expected behavior

## Summary

The intelligent enrichment system now:
- ✅ Intelligently enriches pool (15% probability when pool >= 100)
- ✅ Returns 50 random questions from enriched pool (target: 100+)
- ✅ Maintains 1.5 minute timer per question
- ✅ Provides better performance and user experience
- ✅ Optimizes API costs through smart probability-based enrichment
- ✅ Keeps pool fresh and optimized over time
- ✅ Balances cost and quality automatically

**Key Difference**: Pool continues to grow beyond 100 questions through random enrichment, keeping content fresh while maintaining cost efficiency.

