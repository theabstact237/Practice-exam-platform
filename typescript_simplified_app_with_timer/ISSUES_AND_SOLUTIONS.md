# Issues Faced & Solutions

This document summarizes all the technical issues encountered during the development of the FreeCertify AWS Practice Exam application and how they were resolved.

---

## Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [UI/UX Issues](#uiux-issues)
4. [Translation Feature Issues](#translation-feature-issues)
5. [Development Environment Issues](#development-environment-issues)

---

## Backend Issues

### 1. NameError: `current_count` Not Defined

**File:** `backend/exams/views.py`

**Problem:**
```python
# ERROR: current_count was used before it was defined
return Response({'status': 'success', 'questions_generated': current_count})
```

**Cause:** The variable `current_count` was referenced in the `pre_generate_questions` action before being assigned a value.

**Solution:** Ensured `current_count` is defined before being used in the response:
```python
current_count = Question.objects.filter(exam=exam).count()
return Response({'status': 'success', 'questions_generated': current_count})
```

---

### 2. Database Query Optimization

**Problem:** N+1 query issues causing slow API responses when fetching exams and questions.

**Solution:** Applied Django ORM optimizations:
```python
# Before (N+1 queries)
exams = Exam.objects.all()
for exam in exams:
    questions = exam.questions.all()  # Additional query per exam

# After (optimized)
exams = Exam.objects.prefetch_related('questions').all()
```

**Additional optimizations:**
- Added database indexes to frequently queried fields
- Implemented caching for `random_questions` and `by_type` endpoints
- Added `select_related` for foreign key relationships

---

## Frontend Issues

### 3. Exam-in-Progress Modal Not Appearing on Homepage

**File:** `typescript_simplified_app_with_timer/src/App.tsx`

**Problem:** When users clicked exam buttons from the homepage while having an unfinished exam, the warning modal didn't appear.

**Cause:** The `ExamInProgressModal` was only rendered when `currentPage !== PAGES.HOME` due to an early return statement.

**Before (broken):**
```tsx
if (currentPage === PAGES.HOME) {
  return <HomePage onSelectExam={handleExamSelection} user={user} />;
}

// Modal was rendered here, but never reached when on homepage
{showExamInProgressModal && <ExamInProgressModal ... />}
```

**Solution:** Moved the modal rendering outside the conditional block:
```tsx
return (
  <>
    {currentPage === PAGES.HOME ? (
      <HomePage onSelectExam={handleExamSelection} user={user} />
    ) : (
      // Main exam content
    )}
    
    {/* Modal now renders regardless of current page */}
    {showExamInProgressModal && (
      <ExamInProgressModal
        username={user?.displayName || 'Student'}
        currentExam={currentExamType}
        onContinue={handleContinueExam}
        onAbandon={handleAbandonExam}
        progress={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />
    )}
  </>
);
```

---

### 4. "Abandon & Start New Exam" Button Not Visible

**File:** `typescript_simplified_app_with_timer/src/components/ExamInProgressModal.tsx`

**Problem:** The "Abandon & Start New Exam" button was present in the code but cut off on smaller screen sizes.

**Cause:** The modal content exceeded the viewport height without scroll capability.

**Solution:** Made the modal scrollable:
```tsx
// Added overflow-y-auto and max-height constraints
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
  <div className="bg-slate-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ...">
    {/* Modal content */}
  </div>
</div>
```

---

### 5. Certificate Download Issues

**File:** `typescript_simplified_app_with_timer/src/components/Certificate.tsx`

**Problem:** Initial bundle size was large due to eager loading of PDF generation libraries.

**Solution:** Implemented dynamic imports for `jsPDF` and `html2canvas`:
```tsx
// Before (eager loading)
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// After (lazy loading)
const downloadAsPDF = async () => {
  const jsPDF = (await import('jspdf')).default;
  const html2canvas = (await import('html2canvas')).default;
  // ... rest of the function
};
```

---

## UI/UX Issues

### 6. Non-Responsive Feature Cards Section

**File:** `typescript_simplified_app_with_timer/src/components/HomePage.tsx`

**Problem:** The "Platform Stats Section" showing feature cards (Global Reach, Neural Processing, Scalable Infrastructure, Secure Learning) was not responsive on mobile devices. Cards were getting cut off.

**Before (broken layout):**
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-4 pt-12">
    <div className="glass-card p-6 ...">Global Reach</div>
    <div className="glass-card p-6 ...">Scalable Infrastructure</div>
  </div>
  <div className="space-y-4">
    <div className="glass-card p-6 ...">Neural Processing</div>
    <div className="glass-card p-6 ...">Secure Learning</div>
  </div>
</div>
```

**Solution:** Simplified to a proper responsive 2x2 grid with responsive sizing:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
  <div className="glass-card p-4 sm:p-6 rounded-2xl border-emerald-500/20">
    <Globe className="text-emerald-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
    <div className="font-bold text-white text-sm sm:text-base">Global Reach</div>
  </div>
  <div className="glass-card p-4 sm:p-6 rounded-2xl border-orange-500/20">
    <Cpu className="text-orange-400 mb-2 sm:mb-3 w-5 h-5 sm:w-6 sm:h-6" />
    <div className="font-bold text-white text-sm sm:text-base">Neural Processing</div>
  </div>
  <!-- ... other cards -->
</div>
```

**Key responsive changes:**
- `p-4 sm:p-6` - Smaller padding on mobile
- `text-sm sm:text-base` - Smaller text on mobile
- `w-5 h-5 sm:w-6 sm:h-6` - Smaller icons on mobile
- `gap-3 sm:gap-4` - Tighter gaps on mobile

---

### 7. Platform Stats Section Container Not Responsive

**Problem:** The entire "Enterprise Preparedness For Everyone" section had fixed sizing that didn't adapt to mobile.

**Solution:** Added responsive breakpoints throughout:
```tsx
<div className="glass-card rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 md:p-12 mb-16 sm:mb-24 ...">
  <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold ...">
    Enterprise Preparedness <br />
    <span className="text-sky-400">For Everyone.</span>
  </h2>
  <div className="flex flex-wrap gap-4 sm:gap-8 py-2 sm:py-4">
    <div>
      <div className="text-xl sm:text-3xl font-bold ...">100%</div>
      <div className="text-xs ...">Cloud Native</div>
    </div>
    <!-- Dividers hidden on mobile -->
    <div className="w-px h-10 sm:h-12 bg-slate-800 hidden sm:block"></div>
    <!-- ... -->
  </div>
</div>
```

---

## Translation Feature Issues

### 8. Translation Feature Not Working

**Files:** 
- `typescript_simplified_app_with_timer/src/hooks/useTranslation.ts`
- `typescript_simplified_app_with_timer/src/components/LanguageSelector.tsx`

**Problem:** Clicking on a language in the dropdown did nothing - the page didn't translate.

**Cause:** The Google Translate widget integration was trying to programmatically trigger the hidden dropdown, but it wasn't always available when needed.

**Original approach (unreliable):**
```tsx
const triggerTranslation = (languageCode: string) => {
  const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (selectElement) {
    selectElement.value = languageCode;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  }
};
```

**Solution:** Implemented a more reliable cookie-based approach with fallback:
```tsx
const setTranslateCookie = useCallback((langCode: string) => {
  // Set the googtrans cookie which Google Translate reads
  const value = langCode === 'en' ? '' : `/en/${langCode}`;
  document.cookie = `googtrans=${value}; path=/`;
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
}, []);

const changeLanguage = useCallback((languageCode: string) => {
  // Save preference
  localStorage.setItem(STORAGE_KEY, languageCode);
  
  // Set cookie
  setTranslateCookie(languageCode);
  
  // Try widget first, fall back to page reload
  const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (selectElement) {
    selectElement.value = languageCode;
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    window.location.reload(); // Fallback: reload applies cookie
  }
}, [setTranslateCookie]);
```

**Key improvements:**
1. Cookie-based translation trigger (more reliable)
2. Page reload fallback when widget unavailable
3. Persistence via `localStorage` for returning users

---

## Development Environment Issues

### 9. ModuleNotFoundError: No module named 'django'

**Problem:** Running `python manage.py makemigrations` failed with Django import error.

**Cause:** The Python virtual environment was not activated before running the command.

**Solution:**
```powershell
# Activate virtual environment first
.\venv\Scripts\Activate.ps1

# Then run Django commands
python manage.py makemigrations
python manage.py migrate
```

---

### 10. Directory Path Error

**Problem:** Terminal command failed with "Cannot find path" error.

**Command that failed:**
```powershell
cd backend\backend  # Double 'backend' was incorrect
```

**Solution:** Use the correct path:
```powershell
cd C:\Users\siaka\Documents\aws_exam_complete_with_auth_analytics\backend
```

---

### 11. Browser Automation Click Error

**Problem:** Automated browser testing failed when clicking "Get Started Free" button.

**Error:** `Script failed to execute, this normally means an error was thrown`

**Cause:** A login modal was appearing and blocking the click target.

**Solution:** Close the modal first using keyboard escape:
```typescript
await browser.press_key('Escape');
// Then proceed with the click
```

---

## Summary

| Issue Category | Count | Status |
|---------------|-------|--------|
| Backend Issues | 2 | ✅ Resolved |
| Frontend Issues | 3 | ✅ Resolved |
| UI/UX Issues | 2 | ✅ Resolved |
| Translation Issues | 1 | ✅ Resolved |
| Dev Environment | 3 | ✅ Resolved |
| **Total** | **11** | **All Resolved** |

---

## Lessons Learned

1. **Always test on mobile viewports** - Responsive issues are easy to miss on desktop
2. **Use cookie-based approaches for Google Translate** - More reliable than DOM manipulation
3. **Implement fallbacks** - When one approach fails, have a backup (e.g., page reload)
4. **Lazy load heavy libraries** - Reduces initial bundle size significantly
5. **Activate virtual environments** - Common source of import errors
6. **Make modals scrollable** - Content may exceed viewport on smaller screens
7. **Use responsive Tailwind classes** - `sm:`, `md:`, `lg:` prefixes for breakpoints

---

*Last updated: January 2026*

