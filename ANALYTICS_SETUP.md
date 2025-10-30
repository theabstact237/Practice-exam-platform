# Google Analytics 4 Setup Instructions

## Step 1: Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click "Start measuring" or "Create Account"
3. Set up your account:
   - Account Name: "AWS Practice Exam Platform"
   - Property Name: "AWS Practice Exam"
   - Industry Category: "Education"
   - Business Size: "Small"
4. Choose "Web" as your platform
5. Enter your website URL (e.g., https://azdscsyk.manus.space)
6. Copy your **Measurement ID** (format: G-XXXXXXXXXX)

## Step 2: Update Analytics Configuration

Replace the placeholder in `/src/utils/analytics.ts`:

```typescript
// Replace this line:
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// With your actual Measurement ID:
const GA_MEASUREMENT_ID = 'G-YOUR-ACTUAL-ID';
```

## Step 3: Add Google Analytics Script (Optional)

For better tracking, you can also add the gtag script to your `index.html`:

```html
<!-- Add this to the <head> section of public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR-ACTUAL-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-YOUR-ACTUAL-ID');
</script>
```

## Analytics Events Being Tracked

### Educational Metrics
- `exam_started` - When user starts an exam
- `question_answered` - Each question response with timing
- `question_timed_out` - When questions expire
- `exam_completed` - Full exam completion with score
- `review_mode_entered` - When user enters review mode
- `exam_restarted` - When user restarts an exam
- `progress_milestone` - 25%, 50%, 75%, 100% completion

### User Engagement
- `page_changed` - Navigation between pages
- `exam_type_changed` - Switching between certifications
- `contact_form_submitted` - Contact form usage
- `payment_tab_clicked` - Payment option interest
- `payment_link_clicked` - Actual payment link clicks
- `social_media_clicked` - Social media engagement
- `mobile_menu_toggled` - Mobile interface usage
- `copy_to_clipboard` - Copy actions

### Technical Metrics
- `question_load_error` - Technical issues
- `session_duration` - Time spent on platform

## Custom Dimensions Available

- `device_type` - Mobile vs Desktop
- `returning_user` - New vs Returning visitors
- `preferred_exam_type` - User preferences
- `engagement_level` - Based on session duration

## Viewing Your Analytics

1. Go to Google Analytics dashboard
2. Navigate to "Reports" > "Engagement" > "Events"
3. Look for custom events like `exam_started`, `question_answered`, etc.
4. Use "Realtime" reports to see live activity
5. Create custom reports for educational metrics

## Privacy Compliance

The analytics implementation:
- ✅ Does not collect personal information
- ✅ Respects user privacy settings
- ✅ Only tracks educational and engagement metrics
- ✅ Can be disabled if needed
- ✅ Complies with GDPR and similar regulations

## Useful Analytics Reports to Create

1. **Exam Performance Report**
   - Events: `exam_completed`
   - Metrics: Score distribution, completion rates

2. **User Engagement Report**
   - Events: `session_duration`, `progress_milestone`
   - Metrics: Time on site, engagement depth

3. **Content Effectiveness Report**
   - Events: `question_answered`
   - Metrics: Question difficulty, common mistakes

4. **Conversion Funnel**
   - Events: `exam_started` → `exam_completed` → `contact_form_submitted`
   - Metrics: Drop-off rates, conversion paths

