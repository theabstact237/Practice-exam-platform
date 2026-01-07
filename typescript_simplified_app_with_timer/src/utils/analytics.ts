import ReactGA from 'react-ga4';

// Google Analytics 4 Configuration
const GA_MEASUREMENT_ID = 'G-766HV51E6Z'; // Replace with your actual GA4 Measurement ID

// Initialize Google Analytics
export const initGA = () => {
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    testMode: process.env.NODE_ENV === 'test',
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });
};

// Custom event tracking for educational metrics
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  ReactGA.event({
    action,
    category,
    label,
    value,
  });
};

// Specific tracking functions for the AWS Practice Exam app
export const analytics = {
  // Exam-related events
  examStarted: (examType: string) => {
    trackEvent('exam_started', 'Education', examType);
  },

  questionAnswered: (examType: string, questionId: number, isCorrect: boolean, timeSpent: number) => {
    trackEvent('question_answered', 'Education', `${examType}_${isCorrect ? 'correct' : 'incorrect'}`, timeSpent);
    console.log(`Question ${questionId} answered: ${isCorrect ? 'correct' : 'incorrect'} in ${timeSpent}s`);
  },

  questionTimedOut: (examType: string, questionId: number) => {
    trackEvent('question_timed_out', 'Education', examType, questionId);
  },

  examCompleted: (examType: string, score: number, totalQuestions: number, timeSpent: number) => {
    trackEvent('exam_completed', 'Education', examType, score);
    
    // Additional metrics - simplified for compatibility
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const timeSpentMinutes = Math.round(timeSpent / 60);
    const passStatus = score >= (totalQuestions * 0.7) ? 'pass' : 'fail';
    
    // Track additional details as separate events
    trackEvent('exam_score_percentage', 'Education', examType, scorePercentage);
    trackEvent('exam_duration_minutes', 'Education', examType, timeSpentMinutes);
    trackEvent('exam_pass_status', 'Education', `${examType}_${passStatus}`);
  },

  reviewModeEntered: (examType: string, score: number) => {
    trackEvent('review_mode_entered', 'Education', examType, score);
  },

  examRestarted: (examType: string) => {
    trackEvent('exam_restarted', 'Education', examType);
  },

  // Navigation events
  examTypeChanged: (fromType: string, toType: string) => {
    trackEvent('exam_type_changed', 'Navigation', `${fromType}_to_${toType}`);
  },

  pageChanged: (fromPage: string, toPage: string) => {
    trackEvent('page_changed', 'Navigation', `${fromPage}_to_${toPage}`);
  },

  // Contact and engagement events
  contactFormSubmitted: (hasPhone: boolean) => {
    trackEvent('contact_form_submitted', 'Engagement', hasPhone ? 'with_phone' : 'without_phone');
  },

  paymentTabClicked: (paymentMethod: string) => {
    trackEvent('payment_tab_clicked', 'Engagement', paymentMethod);
  },

  paymentLinkClicked: (paymentMethod: string) => {
    trackEvent('payment_link_clicked', 'Conversion', paymentMethod);
  },

  socialMediaClicked: (platform: string) => {
    trackEvent('social_media_clicked', 'Engagement', platform);
  },

  // User behavior events
  mobileMenuToggled: (isOpen: boolean) => {
    trackEvent('mobile_menu_toggled', 'UI_Interaction', isOpen ? 'opened' : 'closed');
  },

  copyToClipboard: (content: string) => {
    trackEvent('copy_to_clipboard', 'UI_Interaction', content);
  },

  // Performance and error tracking
  questionLoadError: (examType: string, error: string) => {
    trackEvent('question_load_error', 'Error', examType);
    console.error(`Question load error for ${examType}:`, error);
  },

  // User engagement depth
  sessionDuration: (durationMinutes: number) => {
    let engagementLevel = 'low';
    if (durationMinutes > 30) engagementLevel = 'high';
    else if (durationMinutes > 10) engagementLevel = 'medium';
    
    trackEvent('session_duration', 'Engagement', engagementLevel, durationMinutes);
  },

  // Educational progress tracking
  progressMilestone: (examType: string, questionsCompleted: number, totalQuestions: number) => {
    const progressPercentage = Math.round((questionsCompleted / totalQuestions) * 100);
    let milestone = '';
    
    if (progressPercentage >= 100) milestone = 'completed';
    else if (progressPercentage >= 75) milestone = '75_percent';
    else if (progressPercentage >= 50) milestone = '50_percent';
    else if (progressPercentage >= 25) milestone = '25_percent';
    
    if (milestone) {
      trackEvent('progress_milestone', 'Education', `${examType}_${milestone}`, progressPercentage);
    }
  }
};

// Enhanced user properties for better segmentation
export const setUserProperties = (properties: {
  preferred_exam_type?: string;
  device_type?: string;
  returning_user?: boolean;
  engagement_level?: string;
}) => {
  ReactGA.set(properties);
};

// Track user demographics and preferences (privacy-compliant)
export const identifyUser = (userId?: string) => {
  if (userId) {
    ReactGA.set({ user_id: userId });
  }
};

// E-commerce tracking for donations (if implemented)
export const trackDonation = (amount: number, currency: string, method: string) => {
  // Simplified donation tracking
  trackEvent('donation', 'Ecommerce', method, amount);
  trackEvent('donation_currency', 'Ecommerce', currency);
};

export default analytics;

