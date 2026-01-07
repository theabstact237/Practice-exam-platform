# Intelligent Question Pool Enrichment System

## Overview

The system now uses **intelligent random enrichment** to continuously optimize the question pool. Instead of stopping at 100 questions, the system randomly decides to enrich the database occasionally, keeping the pool fresh and optimized.

## How It Works

### Pool System Evolution

**Before:**
- Generate questions until pool reaches 100
- Stop generating once pool is full
- Pool size fixed at 100

**Now (Intelligent Enrichment):**
- Target pool size: 100 questions (baseline)
- Pool can grow beyond 100 through random enrichment
- System randomly decides to enrich with 15% probability (configurable)
- Pool becomes richer and more optimized over time

### Enrichment Logic

```
User clicks exam
    ↓
Check database question count
    ↓
Less than 100? → Always generate (fill to 100)
    ↓
100+ questions? → Random enrichment decision:
    ↓
    15% chance → Generate 10-20 new questions (enrich pool)
    85% chance → Use existing questions (economize resources)
    ↓
Return 50 random questions from enriched pool
```

## Benefits

### 1. **Richer Question Pool**
- Pool grows beyond 100 questions over time
- More variety in questions available
- Better coverage of exam topics

### 2. **Cost-Effective**
- Only enriches 15% of the time (configurable)
- Uses smaller batches (10-20 questions) for enrichment
- Optimizes API usage

### 3. **Self-Optimizing**
- Pool automatically improves over time
- No manual intervention needed
- Keeps content fresh

### 4. **Balanced Resource Usage**
- Below 100: Always fills to target (fast initialization)
- Above 100: Random enrichment (sustained optimization)
- Best of both worlds

## Configuration

### Environment Variables

**Backend Settings** (`backend/aws_exam_backend/settings.py`):

```python
# Probability of enriching when pool is full (0.0 to 1.0)
QUESTION_ENRICHMENT_PROBABILITY = 0.15  # 15% chance

# Minimum batch size for random enrichment
MIN_ENRICHMENT_BATCH = 10  # questions
```

### Environment Variables

Set these in Render dashboard or `.env`:

```env
# Probability of random enrichment (0.0 to 1.0)
# 0.15 = 15% chance to enrich on each request when pool >= 100
QUESTION_ENRICHMENT_PROBABILITY=0.15

# Minimum batch size for random enrichment
# Smaller batches for cost-effective enrichment
MIN_ENRICHMENT_BATCH=10
```

### Configuration Examples

**More Aggressive Enrichment:**
```env
QUESTION_ENRICHMENT_PROBABILITY=0.25  # 25% chance
MIN_ENRICHMENT_BATCH=15
```

**More Conservative (Economize More):**
```env
QUESTION_ENRICHMENT_PROBABILITY=0.10  # 10% chance
MIN_ENRICHMENT_BATCH=5
```

**Disable Random Enrichment:**
```env
QUESTION_ENRICHMENT_PROBABILITY=0.0  # Never enrich randomly
```

## Enrichment Scenarios

### Scenario 1: First Time (Empty Database)

1. Database has: **0 questions**
2. Action: **Always generate** (fill to 100)
3. Generates: **50 questions**
4. Result: Pool at **50/100** (target)

### Scenario 2: Below Pool Size (50 questions)

1. Database has: **50 questions**
2. Action: **Always generate** (fill to 100)
3. Generates: **50 questions**
4. Result: Pool at **100/100** (target reached)

### Scenario 3: Pool Full - Random Enrichment (100 questions)

1. Database has: **100 questions**
2. Action: **Random decision** (15% chance)
3. If enrichment triggered:
   - Generates: **10-20 questions** (smaller batch)
   - Result: Pool grows to **110-120 questions**
4. If not triggered:
   - Uses: **Existing questions**
   - Result: Pool stays at **100 questions**

### Scenario 4: Pool Enriched - Continued Growth (120 questions)

1. Database has: **120 questions**
2. Action: **Random decision** (15% chance)
3. If enrichment triggered:
   - Generates: **10-20 questions**
   - Result: Pool grows to **130-140 questions**
4. Over time: Pool continues to grow and optimize

## API Response Examples

### Random Enrichment Triggered

```json
{
  "success": true,
  "message": "Randomly enriched pool with 12 new questions for AWS Solutions Architect. Total: 112 (pool target: 100)",
  "created_count": 12,
  "requested_count": 20,
  "total_questions": 112,
  "pool_size": 100,
  "enrichment_reason": "random_enrichment",
  "enrichment_attempted": true
}
```

### Random Enrichment Not Triggered

```json
{
  "success": true,
  "message": "Database already has 105 questions (pool of 100). Using existing questions.",
  "current_count": 105,
  "pool_size": 100,
  "created_count": 0,
  "skipped": true,
  "enrichment_attempted": false,
  "reason": "pool_full_no_enrichment"
}
```

### Filling Pool (Below 100)

```json
{
  "success": true,
  "message": "Generated 30 new questions for AWS Solutions Architect. Total: 80/100",
  "created_count": 30,
  "requested_count": 30,
  "total_questions": 80,
  "pool_size": 100,
  "enrichment_reason": "below_pool_size",
  "enrichment_attempted": true
}
```

## Cost Analysis

### Resource Usage

**Without Random Enrichment:**
- Initial: Generate 100 questions (one-time)
- Ongoing: 0 API calls (uses existing)
- **Total**: Fixed at 100 questions

**With Random Enrichment (15% probability):**
- Initial: Generate 100 questions (one-time)
- Ongoing: ~15% of requests trigger enrichment
- If 1000 exam clicks/month:
  - Enrichment attempts: ~150
  - Average batch size: 15 questions
  - Additional questions: ~2,250/month (initially)
  - Over time: Growth rate decreases as pool enriches

### Cost Optimization

**Strategies:**
1. **Probability Tuning**: Lower probability = less API usage
2. **Batch Size**: Smaller batches = more cost-effective
3. **Smart Batching**: Generate multiple questions per API call

**Recommendation:**
- Start with `0.15` (15%) probability
- Use `MIN_ENRICHMENT_BATCH=10` for cost efficiency
- Monitor pool growth and adjust as needed

## Monitoring

### Key Metrics

1. **Pool Size Growth**
   - Monitor total questions per exam
   - Track growth rate over time
   - Identify when pool stabilizes

2. **Enrichment Rate**
   - Track how often enrichment is triggered
   - Compare to expected 15% probability
   - Adjust if needed

3. **API Usage**
   - Monitor OpenAI/Manus API calls
   - Track costs associated with enrichment
   - Optimize batch sizes

### Logs

The system logs enrichment activities:

```
✨ Random enrichment triggered! Added 12 new questions to keep pool fresh.
Database has 105 questions (target: 100). Attempting intelligent enrichment...
Generated 15 questions (reason: random_enrichment)
```

## Best Practices

### 1. **Start Conservative**
- Begin with lower probability (10-15%)
- Monitor pool growth
- Adjust based on usage patterns

### 2. **Monitor Costs**
- Track API usage monthly
- Compare enrichment costs to benefits
- Adjust probability if needed

### 3. **Optimize Batch Sizes**
- Use smaller batches (10-20 questions) for enrichment
- Larger batches (50) for initial pool filling
- Balance cost vs. pool growth rate

### 4. **Regular Review**
- Review pool sizes quarterly
- Adjust enrichment probability based on growth
- Consider disabling if pool is sufficiently large

## Advanced Configuration

### Per-Exam Configuration

You can configure enrichment per exam type by modifying the view:

```python
# Different enrichment rates per exam
ENRICHMENT_CONFIG = {
    'solutions_architect': {'probability': 0.20, 'batch_size': 15},
    'cloud_practitioner': {'probability': 0.10, 'batch_size': 10},
}
```

### Time-Based Enrichment

Enrich more aggressively during peak times:

```python
from datetime import datetime

def get_dynamic_probability():
    hour = datetime.now().hour
    if 9 <= hour <= 17:  # Business hours
        return 0.20  # Higher probability
    else:
        return 0.10  # Lower probability
```

### Usage-Based Enrichment

Enrich more when questions are frequently accessed:

```python
# Track question access frequency
# Enrich more if questions are accessed frequently
```

## Summary

The intelligent enrichment system:

✅ **Enriches pool randomly** (15% probability when pool is full)
✅ **Uses smaller batches** (10-20 questions) for cost efficiency
✅ **Keeps pool growing** beyond 100 questions
✅ **Optimizes automatically** over time
✅ **Balances cost and quality** through configurable probability

**Result**: A self-optimizing question pool that grows and improves automatically while maintaining cost efficiency.


