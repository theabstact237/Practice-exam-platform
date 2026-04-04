import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Mail, Menu, X, BarChart3, User, LogOut } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { signOutUser, updateUserProgress } from './utils/auth';
import { initGA, analytics, setUserProperties } from './utils/analytics';
import { getOrGenerateExamQuestions, getExamsByType, Question as APIQuestion, preGenerateExamQuestions, getReviews, submitReview, Review, registerAnalyticsSession, recordAnalyticsEvent, getSyllabusLectures, SyllabusLecturePlan, streamChatWithSyllabusAssistant, getPinnedPlans, savePinnedPlan, deletePinnedPlan, saveExamAttempt } from './utils/api';
import type { ChatMessage } from './components/AIAssistantModal';
import { getOrCreateSessionKey, getDeviceCategory } from './utils/analyticsClient';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import Certificate from './components/Certificate';
import ExamInProgressModal from './components/ExamInProgressModal';
import ReviewModal, { ReviewData } from './components/ReviewModal';
import ExamLandingPage from './components/ExamLandingPage';
import { Testimonial } from './components/TestimonialsCarousel';
import AIAssistantModal from './components/AIAssistantModal';
import UserProfileModal from './components/UserProfileModal';

// Define page types for navigation
const PAGES = {
  HOME: 'home',
  EXAM_LANDING: 'exam_landing',
  EXAM: 'exam',
  CONTACT: 'contact',
  REVIEW: 'review'
};

// Define exam types
const EXAM_TYPES = {
  SOLUTIONS_ARCHITECT: 'solutions_architect',
  CLOUD_PRACTITIONER: 'cloud_practitioner',
  DEVELOPER: 'developer'
};

// Define TypeScript interfaces
interface Option {
  letter: string;
  text: string;
}

interface Question {
  id: number;
  domain?: string;
  questionText?: string;
  question?: string;
  options: Option[] | { [key: string]: string };
  correctAnswerLetter: string;
  explanation: string;
  difficulty?: string;
}

interface UserAnswerRecord {
  selectedLetter: string | null;
  isCorrect: boolean | null;
  attempted: boolean;
  timedOut?: boolean;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Button component to replace the imported one
const Button: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}> = ({ children, className = '', onClick, disabled = false, type = 'button' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

// Difficulty Badge Component
const DifficultyBadge: React.FC<{ difficulty?: string }> = ({ difficulty }) => {
  if (!difficulty) return null;
  
  const difficultyStyles: { [key: string]: string } = {
    easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  };
  
  const difficultyIcons: { [key: string]: string } = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴',
  };
  
  const style = difficultyStyles[difficulty.toLowerCase()] || difficultyStyles.medium;
  const icon = difficultyIcons[difficulty.toLowerCase()] || '🟡';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style} backdrop-blur-sm`}>
      <span className="text-[10px]">{icon}</span>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

// Domain Badge Component  
const DomainBadge: React.FC<{ domain?: string }> = ({ domain }) => {
  if (!domain) return null;
  
  const getDomainStyle = (d: string): string => {
    const dl = d.toLowerCase();
    if (['ec2', 'lambda', 'ecs', 'eks', 'compute'].some(x => dl.includes(x))) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (['s3', 'storage', 'ebs', 'efs', 'glacier'].some(x => dl.includes(x))) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (['rds', 'dynamodb', 'database', 'aurora'].some(x => dl.includes(x))) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (['vpc', 'network', 'cloudfront', 'route'].some(x => dl.includes(x))) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (['iam', 'security', 'kms', 'waf'].some(x => dl.includes(x))) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (['cloudwatch', 'monitoring', 'cloudtrail'].some(x => dl.includes(x))) return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    if (['cloud', 'general', 'pricing', 'billing'].some(x => dl.includes(x))) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getDomainStyle(domain)} backdrop-blur-sm`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      {domain}
    </span>
  );
};

function App() {
  // State management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: UserAnswerRecord }>({});
  const [selectedAnswerLetter, setSelectedAnswerLetter] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);  // Start with home page
  const [currentExamType, setCurrentExamType] = useState(EXAM_TYPES.SOLUTIONS_ARCHITECT);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isPreGenerating, setIsPreGenerating] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(90); // 1.5 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  
  // Contact form state
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState('cashapp');
  const [copySuccess, setCopySuccess] = useState('');

  // Analytics state
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Authentication state
  const [user] = useAuthState(auth);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hasShownLoginPrompt, setHasShownLoginPrompt] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantChatLoading, setAssistantChatLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantStatusMsg, setAssistantStatusMsg] = useState<string | null>(null);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string | null>(null);
  const [lecturePlan, setLecturePlan] = useState<SyllabusLecturePlan | null>(null);
  const [assistantChatInput, setAssistantChatInput] = useState('');
  const [assistantChatMessages, setAssistantChatMessages] = useState<ChatMessage[]>([]);
  const [assistantPinned, setAssistantPinned] = useState(false);

  // Exam lock state - prevent switching during active exam
  const [examInProgress, setExamInProgress] = useState(false);
  const [showExamInProgressModal, setShowExamInProgressModal] = useState(false);
  const [pendingExamType, setPendingExamType] = useState<string | null>(null);

  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false);
  const [examCompletionDate, setExamCompletionDate] = useState<Date>(new Date());
  const [certScore, setCertScore] = useState(0);
  const [certTotal, setCertTotal] = useState(0);
  const [certPercentage, setCertPercentage] = useState(0);
  const [certExamType, setCertExamType] = useState('');

  // Review/Testimonial state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingCertificate, setPendingCertificate] = useState(false);
  const [lastExamScore, setLastExamScore] = useState(0);
  const [lastExamPassed, setLastExamPassed] = useState(false);
  const [currentExamId, setCurrentExamId] = useState(1);
  const [examDomainScores, setExamDomainScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [examTimeTaken, setExamTimeTaken] = useState(0); // seconds
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Custom display name / photo saved in localStorage (overrides Firebase values)
  const [profileName, setProfileName] = useState(() => localStorage.getItem('fc_profile_name') || '');
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('fc_profile_photo') || '');

  // Initialize Google Analytics on component mount
  useEffect(() => {
    initGA();
    
    // Set user properties
    setUserProperties({
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      returning_user: localStorage.getItem('aws_exam_visited') === 'true'
    });
    
    // Mark as visited
    localStorage.setItem('aws_exam_visited', 'true');

    // Server-side practice analytics (session + device)
    const sk = getOrCreateSessionKey();
    void registerAnalyticsSession(sk, getDeviceCategory());
    
    // Track session start
    analytics.pageChanged('', 'exam');
    
    // Track session duration on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Math.round((Date.now() - sessionStartTime) / 60000); // minutes
      analytics.sessionDuration(sessionDuration);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionStartTime]);

  // Show AI assistant on login and restore pinned plan from DB
  useEffect(() => {
    if (!user) return;

    const restorePinned = async () => {
      try {
        const plans = await getPinnedPlans(user.uid);
        if (plans.length > 0) {
          const latest = plans[0];
          setLecturePlan(latest.lecture_plan);
          setSelectedSyllabus(latest.syllabus);
          setAssistantChatMessages(latest.chat_messages || []);
          setAssistantPinned(true);
        }
      } catch {
        // DB unavailable — fall back to localStorage
        const pinnedRaw = localStorage.getItem(`ai_pinned_plan_${user.uid}`);
        if (pinnedRaw) {
          try {
            const saved = JSON.parse(pinnedRaw);
            if (saved.lecturePlan && saved.syllabus) {
              setLecturePlan(saved.lecturePlan);
              setSelectedSyllabus(saved.syllabus);
              setAssistantChatMessages(saved.chatMessages || []);
              setAssistantPinned(true);
            }
          } catch { /* ignore corrupt data */ }
        }
      }
    };

    restorePinned();
    setShowAIAssistant(true);
  }, [user]);

  // Fetch testimonials for homepage
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const reviews = await getReviews(100);
        // Transform reviews to testimonials format
        const transformedTestimonials: Testimonial[] = reviews.map((review: Review) => ({
          id: review.id,
          user_name: review.user_name,
          user_photo_url: review.user_photo_url,
          exam_name: review.exam_name,
          rating: review.rating,
          comment: review.comment,
          passed: review.passed || false,
          exam_score: review.exam_score,
          created_at: review.created_at
        }));
        setTestimonials(transformedTestimonials);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      }
    };
    
    fetchTestimonials();
  }, []);

  // Load questions based on exam type from Django API (only when on exam page)
  useEffect(() => {
    if (currentPage !== PAGES.EXAM) return; // Only load when on exam page
    
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      setLoadingError(null);
      setQuestions([]);
      
      try {
        // Map frontend exam types to backend exam types
        const examTypeMap: { [key: string]: string } = {
          [EXAM_TYPES.SOLUTIONS_ARCHITECT]: 'solutions_architect',
          [EXAM_TYPES.CLOUD_PRACTITIONER]: 'cloud_practitioner',
          [EXAM_TYPES.DEVELOPER]: 'developer'
        };

        const backendExamType = examTypeMap[currentExamType] || currentExamType;

        // Resolve the real exam ID from the API (avoids hardcoded ID assumptions)
        getExamsByType(backendExamType).then(exams => {
          if (exams.length > 0) setCurrentExamId(exams[0].id);
        }).catch(() => {});
        
        // Get or generate questions from Django API with timeout (using Manus API by default)
        const apiQuestions = await Promise.race([
          getOrGenerateExamQuestions(backendExamType, 50, true),  // Use Manus API
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timed out after 60 seconds')), 60000)
          )
        ]);
        
        // Transform API questions to match frontend format
        const transformedQuestions: Question[] = apiQuestions.map((q: APIQuestion) => ({
          id: q.id,
          questionText: q.question_text || q.question || '',
          question: q.question_text || q.question || '',
          domain: q.domain,
          difficulty: q.difficulty,
          options: q.options || q.answers.map(a => ({ letter: a.letter, text: a.text })),
          correctAnswerLetter: q.correct_answer_letter || 
            q.answers.find(a => a.is_correct)?.letter || '',
          explanation: q.explanation || ''
        }));
        
        setQuestions(transformedQuestions);
        
        // Reset exam state when switching exam types
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setSelectedAnswerLetter(null);
        setShowFeedback(false);
        setIsReviewMode(false);
        setTimeRemaining(90);
        setTimerActive(false);
        setQuestionStartTime(Date.now());
        
        // Mark exam as in progress
        setExamInProgress(true);
        setShowCertificate(false);
        
        // Track exam started
        analytics.examStarted(currentExamType);
        {
          const sk = getOrCreateSessionKey();
          await registerAnalyticsSession(sk, getDeviceCategory());
          await recordAnalyticsEvent(sk, currentExamType, 'exam_start');
        }
        setIsLoadingQuestions(false);
        
      } catch (error) {
        console.error('Error loading questions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLoadingError(errorMessage);
        analytics.questionLoadError(currentExamType, errorMessage);
        setQuestions([]);
        setIsLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [currentExamType, currentPage]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerActive && timeRemaining > 0 && !showFeedback && !isReviewMode) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-submit current question
            handleTimeUp();
            return 90; // Reset for next question
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerActive, timeRemaining, showFeedback, isReviewMode]);

  // Start timer when a new question loads (not in review mode)
  useEffect(() => {
    if (questions.length > 0 && !isReviewMode) {
      setTimeRemaining(90);
      setTimerActive(true);
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, questions, isReviewMode]);

  const handleTimeUp = () => {
    if (currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      
      // Track timeout event
      analytics.questionTimedOut(currentExamType, currentQuestion.id);
      
      // Mark as timed out
      setUserAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: {
          selectedLetter: null,
          isCorrect: false,
          attempted: true,
          timedOut: true
        }
      }));
      
      setSelectedAnswerLetter(null);
      setShowFeedback(true);
      setTimerActive(false);
    }
  };

  const handleExamTypeChange = async (examType: string) => {
    // Check if exam is in progress and user is trying to switch
    if (examInProgress && examType !== currentExamType && !isReviewMode) {
      setPendingExamType(examType);
      setShowExamInProgressModal(true);
      return;
    }
    
    // Track exam type change
    analytics.examTypeChanged(currentExamType, examType);
    
    setCurrentExamType(examType);
    setCurrentPage(PAGES.EXAM);
    
    // Pre-generate questions when exam tab is clicked (using Manus API)
    const examTypeMap: { [key: string]: string } = {
      [EXAM_TYPES.SOLUTIONS_ARCHITECT]: 'solutions_architect',
      [EXAM_TYPES.CLOUD_PRACTITIONER]: 'cloud_practitioner',
      [EXAM_TYPES.DEVELOPER]: 'developer'
    };
    
    const backendExamType = examTypeMap[examType] || examType;
    
    try {
      setIsPreGenerating(true);
      // Pre-generate questions in background (using Manus API)
      await preGenerateExamQuestions(backendExamType, 50, true);
      console.log(`✅ Pre-generated questions for ${backendExamType}`);
    } catch (error) {
      console.error('Error pre-generating questions:', error);
      // Continue anyway - questions might already exist
    } finally {
      setIsPreGenerating(false);
    }
  };

  const getExamTitle = () => {
    switch (currentExamType) {
      case EXAM_TYPES.CLOUD_PRACTITIONER:
        return 'AWS Cloud Practitioner Practice Exam';
      case EXAM_TYPES.DEVELOPER:
        return 'AWS Developer Associate Practice Exam';
      default:
        return 'AWS Solutions Architect Practice Exam';
    }
  };

  const handleAnswerSelect = (letter: string) => {
    if (showFeedback && isReviewMode) return; // Prevent changes in review mode
    
    setSelectedAnswerLetter(letter);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswerLetter || showFeedback) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswerLetter === currentQuestion.correctAnswerLetter;
    const timeSpent = Math.round((Date.now() - questionStartTime) / 1000); // seconds
    
    // Track question answered
    analytics.questionAnswered(currentExamType, currentQuestion.id, isCorrect, timeSpent);
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: {
        selectedLetter: selectedAnswerLetter,
        isCorrect,
        attempted: true,
        timedOut: false
      }
    }));
    
    setShowFeedback(true);
    setTimerActive(false); // Stop the timer when answer is submitted
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      
      // Show login prompt after 25th question (index 24) for non-authenticated users
      // User can skip login and continue - they just won't get certificate at the end
      if (nextQuestionIndex === 25 && !user && !hasShownLoginPrompt) {
        setShowLoginModal(true);
        setHasShownLoginPrompt(true);
        analytics.paymentTabClicked('login_prompt_shown');
        // Don't return - allow user to continue after modal is shown
      }
      
      // Track progress milestone
      analytics.progressMilestone(currentExamType, nextQuestionIndex, questions.length);
      
      // Update user progress if authenticated
      if (user) {
        updateUserProgress(user.uid, currentExamType, nextQuestionIndex);
      }
      
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerLetter(null);
      setShowFeedback(false);
      setTimeRemaining(90);
      setQuestionStartTime(Date.now());
      if (!isReviewMode) {
        setTimerActive(true);
      }
    } else {
      // Exam completed - calculate and track results
      const score = Object.values(userAnswers).filter(answer => answer.isCorrect).length;
      const totalTime = Math.round((Date.now() - sessionStartTime) / 1000); // seconds
      const percentage = Math.round((score / questions.length) * 100);

      // Compute per-domain breakdown
      const domainScores: Record<string, { correct: number; total: number }> = {};
      questions.forEach(q => {
        const domain = q.domain || 'General';
        if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
        domainScores[domain].total++;
        if (userAnswers[q.id]?.isCorrect) domainScores[domain].correct++;
      });
      setExamDomainScores(domainScores);
      setExamTimeTaken(totalTime);

      // Persist full attempt for logged-in users
      if (user) {
        const questionResults = questions.map(q => {
          const ans = userAnswers[q.id];
          const opts = Array.isArray(q.options)
            ? q.options
            : Object.entries(q.options || {}).map(([letter, text]) => ({ letter, text: String(text) }));
          return {
            question_id: q.id,
            question_text: q.questionText || q.question || '',
            domain: q.domain || 'General',
            options: opts,
            correct_letter: q.correctAnswerLetter,
            selected_letter: ans?.selectedLetter ?? null,
            is_correct: ans?.isCorrect ?? false,
            timed_out: ans?.timedOut ?? false,
            explanation: q.explanation || '',
          };
        });
        void saveExamAttempt({
          user_uid: user.uid,
          exam_type: currentExamType,
          exam_title: getExamTitle ? getExamTitle() : currentExamType,
          score_percent: percentage,
          correct: score,
          total: questions.length,
          passed: percentage >= 70,
          time_taken_seconds: totalTime,
          domain_scores: domainScores,
          question_results: questionResults,
        });
      }

      analytics.examCompleted(currentExamType, score, questions.length, totalTime);
      {
        const sk = getOrCreateSessionKey();
        void registerAnalyticsSession(sk, getDeviceCategory());
        void recordAnalyticsEvent(sk, currentExamType, 'exam_complete', percentage, domainScores);
      }
      
      // Update final progress if authenticated
      if (user) {
        updateUserProgress(user.uid, currentExamType, questions.length);
      }
      
      setIsReviewMode(true);
      setCurrentPage(PAGES.REVIEW);
      setTimerActive(false);
      setExamInProgress(false); // Mark exam as complete
      setExamCompletionDate(new Date());
      
      // Store exam results for review modal
      setLastExamScore(percentage);
      setLastExamPassed(percentage >= 70);
      
      // currentExamId is already set during question loading via getExamsByType
      
      // Show review modal if user passed (they can then get certificate after review)
      if (percentage >= 70 && user) {
        setPendingCertificate(true);
        setShowReviewModal(true);
      }
      
      // Track review mode entry
      analytics.reviewModeEntered(currentExamType, score);
    }
  };

  const handleReviewNavigation = (questionIndex: number) => {
    setCurrentQuestionIndex(questionIndex);
    const currentQuestion = questions[questionIndex];
    const userAnswer = userAnswers[currentQuestion.id];
    
    if (userAnswer) {
      setSelectedAnswerLetter(userAnswer.selectedLetter);
      setShowFeedback(true);
    } else {
      setSelectedAnswerLetter(null);
      setShowFeedback(false);
    }
  };

  const handleRestartExam = () => {
    // Track exam restart
    analytics.examRestarted(currentExamType);
    
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSelectedAnswerLetter(null);
    setShowFeedback(false);
    setIsReviewMode(false);
    setCurrentPage(PAGES.EXAM);
    setTimeRemaining(90);
    setTimerActive(true);
    setQuestionStartTime(Date.now());
    setExamInProgress(true);
    setShowCertificate(false);
  };

  // Handle review submission
  const handleReviewSubmit = async (reviewData: ReviewData) => {
    try {
      const result = await submitReview(reviewData);
      console.log('Review submitted successfully', result);

      // Immediately add the new review to the top of the testimonials list
      // so the user sees it as soon as they return to the homepage
      const newTestimonial: Testimonial = {
        id: Date.now(), // temporary ID until the re-fetch resolves
        user_name: reviewData.user_name,
        user_photo_url: reviewData.user_photo_url,
        exam_name: getExamTitle(),
        rating: reviewData.rating,
        comment: reviewData.comment,
        passed: reviewData.passed,
        exam_score: reviewData.exam_score,
        created_at: new Date().toISOString(),
      };
      setTestimonials(prev => [newTestimonial, ...prev]);

      // Background refresh to pick up the real DB record (with correct ID)
      getReviews(100).then(reviews => {
        const refreshed: Testimonial[] = reviews.map((review: Review) => ({
          id: review.id,
          user_name: review.user_name,
          user_photo_url: review.user_photo_url,
          exam_name: review.exam_name,
          rating: review.rating,
          comment: review.comment,
          passed: review.passed || false,
          exam_score: review.exam_score,
          created_at: review.created_at,
        }));
        setTestimonials(refreshed);
      }).catch(() => {});

    } catch (error) {
      console.error('Error submitting review:', error);
      // Rethrow so the ReviewModal can display an error state
      throw error;
    } finally {
      // Close review modal and show certificate whether submission succeeded or failed
      setShowReviewModal(false);
      if (pendingCertificate) {
        const sc = calculateScore();
        setCertExamType(currentExamType);
        setCertScore(sc.correct);
        setCertTotal(sc.total);
        setCertPercentage(sc.percentage);
        setShowCertificate(true);
        setPendingCertificate(false);
      }
    }
  };

  // Handle review modal close (skip)
  const handleReviewClose = () => {
    setShowReviewModal(false);
    if (pendingCertificate) {
      const sc = calculateScore();
      setCertExamType(currentExamType);
      setCertScore(sc.correct);
      setCertTotal(sc.total);
      setCertPercentage(sc.percentage);
      setShowCertificate(true);
      setPendingCertificate(false);
    }
  };

  // Handle continuing current exam from modal
  const handleContinueExam = () => {
    setShowExamInProgressModal(false);
    setPendingExamType(null);
    // Navigate back to exam page if on homepage
    if (currentPage === PAGES.HOME) {
      setCurrentPage(PAGES.EXAM);
    }
  };

  // Handle abandoning current exam to start new one
  const handleAbandonExam = async () => {
    setShowExamInProgressModal(false);
    setExamInProgress(false);
    
    if (pendingExamType) {
      // Track exam abandonment
      analytics.examTypeChanged(currentExamType, pendingExamType);
      
      setCurrentExamType(pendingExamType);
      setCurrentPage(PAGES.EXAM);
      setPendingExamType(null);
      
      // Reset exam state
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSelectedAnswerLetter(null);
      setShowFeedback(false);
      setIsReviewMode(false);
      setTimeRemaining(90);
      setQuestionStartTime(Date.now());
      setShowCertificate(false);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // Continue to next question after successful login
    const nextQuestionIndex = currentQuestionIndex + 1;
    analytics.progressMilestone(currentExamType, nextQuestionIndex, questions.length);
    
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswerLetter(null);
    setShowFeedback(false);
    setTimeRemaining(90);
    setQuestionStartTime(Date.now());
    if (!isReviewMode) {
      setTimerActive(true);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setHasShownLoginPrompt(false);
    setShowAIAssistant(false);
    setLecturePlan(null);
    setSelectedSyllabus(null);
    setAssistantError(null);
    setAssistantChatMessages([]);
    setAssistantPinned(false);
    setShowProfileModal(false);
  };

  // Called by UserProfileModal after the user saves their name/photo
  const handleProfileUpdate = () => {
    setProfileName(localStorage.getItem('fc_profile_name') || '');
    setProfilePhoto(localStorage.getItem('fc_profile_photo') || '');
  };

  // Resolved display values (custom > Firebase > fallback)
  const displayName = profileName || user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayPhoto = profilePhoto || user?.photoURL || '';

  // Open a past-attempt certificate from the profile modal
  const handleProfileCertificate = (
    examType: string,
    score: number,
    total: number,
    percentage: number,
    date: Date,
  ) => {
    setCertExamType(examType);
    setCertScore(score);
    setCertTotal(total);
    setCertPercentage(percentage);
    setExamCompletionDate(date);
    setShowProfileModal(false);
    setShowCertificate(true);
  };

  const persistPinnedPlan = (
    syllabus: string,
    plan: SyllabusLecturePlan,
    messages: ChatMessage[],
  ) => {
    if (!user) return;
    // Save to DB (primary) and localStorage (fallback)
    savePinnedPlan(user.uid, syllabus, plan, messages).catch(() => {});
    localStorage.setItem(
      `ai_pinned_plan_${user.uid}`,
      JSON.stringify({ syllabus, lecturePlan: plan, chatMessages: messages }),
    );
  };

  const handleSyllabusSelection = async (syllabus: string) => {
    setSelectedSyllabus(syllabus);
    setAssistantError(null);
    setAssistantStatusMsg(null);
    setAssistantLoading(true);
    setAssistantChatMessages([]);
    setAssistantChatInput('');
    setAssistantPinned(false);
    try {
      const response = await getSyllabusLectures(syllabus, () => {
        setAssistantStatusMsg('Server is waking up, please wait a moment...');
      });
      setLecturePlan(response);
      const starterMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        {
          role: 'assistant',
          content: `Great choice. I generated a lecture roadmap for ${response.syllabus_label}. Ask me anything about these lectures and I will guide you.`,
        },
      ];
      setAssistantChatMessages(starterMessages);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate lecture plan.';
      setAssistantError(message);
    } finally {
      setAssistantLoading(false);
      setAssistantStatusMsg(null);
    }
  };

  const sendChatMessage = async (userMessage: string) => {
    if (!selectedSyllabus || !lecturePlan || !userMessage.trim() || assistantChatLoading) return;

    setAssistantChatInput('');
    setAssistantError(null);

    // Snapshot on-topic history BEFORE adding the new user message
    const onTopicHistory = assistantChatMessages.filter(m => !m.off_topic);

    const withUser: ChatMessage[] = [...assistantChatMessages, { role: 'user', content: userMessage }];
    // Add an empty assistant bubble immediately so the user sees it filling in
    const withPlaceholder: ChatMessage[] = [...withUser, { role: 'assistant', content: '', off_topic: false }];
    setAssistantChatMessages(withPlaceholder);
    setAssistantChatLoading(true);

    // Plain object so the closure always reads the latest accumulated text
    const acc = { text: '' };

    try {
      await streamChatWithSyllabusAssistant(
        selectedSyllabus,
        userMessage,
        lecturePlan.lectures,
        onTopicHistory,
        // onDelta — append each token to the last message
        (delta) => {
          acc.text += delta;
          const snapshot = acc.text;
          setAssistantChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: snapshot, off_topic: false };
            return updated;
          });
        },
        // onDone
        (offTopic, _provider) => {
          if (offTopic) {
            const offTopicMsg: ChatMessage = {
              role: 'assistant',
              content: 'I can only help with topics related to your AWS certification study plan. Please ask me about AWS services, exam concepts, lecture content, or study strategies.',
              off_topic: true,
            };
            setAssistantChatMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = offTopicMsg;
              return updated;
            });
          }
          setAssistantChatLoading(false);
          if (assistantPinned && selectedSyllabus && lecturePlan) {
            setAssistantChatMessages(prev => {
              persistPinnedPlan(selectedSyllabus, lecturePlan, prev);
              return prev;
            });
          }
        },
        // onError
        (errMsg) => {
          setAssistantError(errMsg);
          setAssistantChatMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: `I could not answer right now: ${errMsg}` };
            return updated;
          });
          setAssistantChatLoading(false);
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Assistant failed to respond.';
      setAssistantError(message);
      setAssistantChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: `I could not answer right now: ${message}` };
        return updated;
      });
      setAssistantChatLoading(false);
    }
  };

  const handleAssistantSendMessage = () => {
    sendChatMessage(assistantChatInput.trim());
  };

  const handleAssistantQuickPrompt = (text: string) => {
    sendChatMessage(text);
  };

  const handleToggleAssistantPin = () => {
    if (!user || !selectedSyllabus || !lecturePlan) return;
    if (assistantPinned) {
      // Remove from DB and localStorage
      deletePinnedPlan(user.uid, selectedSyllabus).catch(() => {});
      localStorage.removeItem(`ai_pinned_plan_${user.uid}`);
      setAssistantPinned(false);
    } else {
      persistPinnedPlan(selectedSyllabus, lecturePlan, assistantChatMessages);
      setAssistantPinned(true);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track contact form submission
    analytics.contactFormSubmitted(contactForm.phone.length > 0);
    
    setFormSubmitted(true);
    // Reset form
    setContactForm({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Track copy action
      analytics.copyToClipboard(text);
      
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const totalQuestions = questions.length;
    const correctAnswers = Object.values(userAnswers).filter(answer => answer.isCorrect).length;
    return {
      correct: correctAnswers,
      total: totalQuestions,
      percentage: Math.round((correctAnswers / totalQuestions) * 100)
    };
  };

  // Handle exam selection - go to landing page first
  const handleExamSelection = (examType: string) => {
    // Check if exam is in progress and user is trying to switch
    if (examInProgress && examType !== currentExamType && !isReviewMode) {
      setPendingExamType(examType);
      setShowExamInProgressModal(true);
      return;
    }
    
    setCurrentExamType(examType);
    setCurrentPage(PAGES.EXAM_LANDING);
  };

  // Handle starting the actual exam from landing page
  const handleStartExam = async () => {
    setIsPreGenerating(true);
    setCurrentPage(PAGES.EXAM);
    
    // Map frontend exam types to backend exam types
    const examTypeMap: { [key: string]: string } = {
      [EXAM_TYPES.SOLUTIONS_ARCHITECT]: 'solutions_architect',
      [EXAM_TYPES.CLOUD_PRACTITIONER]: 'cloud_practitioner',
      [EXAM_TYPES.DEVELOPER]: 'developer'
    };

    const backendExamType = examTypeMap[currentExamType] || currentExamType;
    
    try {
      // Pre-generate questions when user starts exam
      console.log(`Pre-generating questions for ${backendExamType}...`);
      await preGenerateExamQuestions(backendExamType, 50, true);
      console.log('Pre-generation complete!');
    } catch (error) {
      console.error('Error pre-generating questions:', error);
      // Continue anyway - questions might already exist
    } finally {
      setIsPreGenerating(false);
      // Questions will load via useEffect when currentExamType changes
    }
  };

  // Handle navigation to contact page
  const handleContactClick = () => {
    setCurrentPage(PAGES.CONTACT);
    setMobileMenuOpen(false);
  };

  // Show home page if not on exam page
  if (currentPage === PAGES.HOME) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <HomePage 
          onSelectExam={handleExamSelection}
          onContactClick={handleContactClick}
          onOpenAIAssistant={() => setShowAIAssistant(true)}
          onOpenAnalytics={() => setShowAnalyticsDashboard(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          user={user}
          testimonials={testimonials}
          userDisplayName={displayName}
          userDisplayPhoto={displayPhoto}
        />
        
        {/* Exam In Progress Modal - also shown on homepage */}
        <ExamInProgressModal
          isVisible={showExamInProgressModal}
          onClose={() => setShowExamInProgressModal(false)}
          onContinueExam={handleContinueExam}
          onAbandonExam={handleAbandonExam}
          userName={displayName}
          currentExamType={currentExamType}
          currentProgress={currentQuestionIndex + 1}
          totalQuestions={questions.length || 50}
        />

        {/* AI Assistant Modal - shown on homepage too */}
        <AIAssistantModal
          isVisible={showAIAssistant}
          loading={assistantLoading}
          chatLoading={assistantChatLoading}
          error={assistantError}
          statusMsg={assistantStatusMsg}
          selectedSyllabus={selectedSyllabus}
          lecturePlan={lecturePlan}
          chatMessages={assistantChatMessages}
          chatInput={assistantChatInput}
          isPinned={assistantPinned}
          onClose={() => setShowAIAssistant(false)}
          onSelectSyllabus={handleSyllabusSelection}
          onChatInputChange={setAssistantChatInput}
          onSendMessage={handleAssistantSendMessage}
          onQuickPromptSend={handleAssistantQuickPrompt}
          onTogglePin={handleToggleAssistantPin}
        />

        {/* Analytics Dashboard - accessible from homepage for logged-in users */}
        <AnalyticsDashboard
          isVisible={showAnalyticsDashboard}
          onClose={() => setShowAnalyticsDashboard(false)}
        />

        {/* User Profile Modal - accessible from homepage */}
        {user && (
          <UserProfileModal
            isVisible={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={user}
            onViewCertificate={handleProfileCertificate}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
      </div>
    );
  }

  // Show exam landing page
  if (currentPage === PAGES.EXAM_LANDING) {
    return (
      <>
        <ExamLandingPage
          examType={currentExamType}
          onStartExam={handleStartExam}
          onGoBack={() => setCurrentPage(PAGES.HOME)}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
        />
        <LoginModal
          isVisible={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          questionNumber={currentQuestionIndex + 1}
          examType={currentExamType}
        />
      </>
    );
  }

  // Show loading if questions are being generated or loaded
  if (isPreGenerating || isLoadingQuestions || (currentPage === PAGES.EXAM && questions.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          {(isPreGenerating || isLoadingQuestions) && (
            <>
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-xl">
                {isPreGenerating ? 'Preparing exam questions...' : 'Loading questions...'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {isPreGenerating ? 'Generating questions using AI. This may take a moment...' : 'This may take a moment...'}
              </p>
            </>
          )}
          {loadingError && !isLoadingQuestions && (
            <div className="max-w-md">
              <div className="text-red-400 mb-4">
                <svg className="h-16 w-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl font-semibold">Error Loading Questions</p>
              </div>
              <p className="text-slate-300 mb-4">{loadingError}</p>
              <button
                onClick={() => {
                  setLoadingError(null);
                  // Trigger useEffect by changing a dependency or force reload
                  window.location.reload();
                }}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
              <p className="text-xs text-slate-400 mt-2">
                {window.location.hostname.includes('onrender.com') 
                  ? 'The backend server may be starting up. Please wait a moment and try again.'
                  : 'Make sure the backend server is running on http://localhost:8000'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const renderExamPage = () => {
    if (isReviewMode) {
      const score = calculateScore();
      const passed = score.percentage >= 70;
      const timedOutCount = Object.values(userAnswers).filter(a => a.timedOut).length;
      const notAttempted = score.total - Object.values(userAnswers).filter(a => a.attempted).length;
      const timeMins = Math.floor(examTimeTaken / 60);
      const timeSecs = examTimeTaken % 60;

      // Sort domains: weakest first
      const sortedDomains = Object.entries(examDomainScores).sort(
        ([, a], [, b]) => (a.correct / a.total) - (b.correct / b.total)
      );
      const weakDomains = sortedDomains.filter(([, s]) => s.total > 0 && (s.correct / s.total) < 0.6);

      return (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* ── Hero Card ── */}
          <div className={`rounded-2xl shadow-xl overflow-hidden border ${passed ? 'border-emerald-500/40' : 'border-amber-500/40'}`}>
            {/* Coloured header strip */}
            <div className={`px-6 py-4 flex items-center justify-between ${passed ? 'bg-gradient-to-r from-emerald-700/50 to-emerald-600/30' : 'bg-gradient-to-r from-amber-700/50 to-amber-600/30'}`}>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {passed ? '🎉 Exam Passed!' : '📋 Exam Complete'}
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">{getExamTitle()}</p>
              </div>
              <div className="text-right">
                <div className={`text-5xl font-black ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {score.percentage}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {timeMins}m {timeSecs}s &nbsp;·&nbsp; {score.total} questions
                </div>
              </div>
            </div>

            <div className="bg-slate-800 px-6 py-5">
              {/* Stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="bg-slate-700/60 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{score.correct}</div>
                  <div className="text-xs text-slate-400 mt-1">Correct</div>
                </div>
                <div className="bg-slate-700/60 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{score.total - score.correct - notAttempted}</div>
                  <div className="text-xs text-slate-400 mt-1">Incorrect</div>
                </div>
                <div className="bg-slate-700/60 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{timedOutCount}</div>
                  <div className="text-xs text-slate-400 mt-1">Timed Out</div>
                </div>
                <div className="bg-slate-700/60 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-slate-300">{notAttempted}</div>
                  <div className="text-xs text-slate-400 mt-1">Skipped</div>
                </div>
              </div>

              {/* Pass / Fail explanation */}
              {passed ? (
                <div className="rounded-lg p-4 bg-emerald-600/15 border border-emerald-500/30 text-sm text-emerald-200">
                  <span className="font-semibold">Well done!</span> You exceeded the 70% passing threshold by {score.percentage - 70} points.
                  {user && ' Your certificate is ready to download.'}
                </div>
              ) : (
                <div className="rounded-lg p-4 bg-red-600/15 border border-red-500/30 text-sm text-red-200">
                  <span className="font-semibold">Why you didn't pass:</span> You scored {score.percentage}% — {70 - score.percentage} point{70 - score.percentage !== 1 ? 's' : ''} short of the 70% passing mark.
                  {' '}You answered {score.total - score.correct} question{score.total - score.correct !== 1 ? 's' : ''} incorrectly
                  {timedOutCount > 0 ? ` and ${timedOutCount} timed out` : ''}.
                  {weakDomains.length > 0 && (
                    <span> Focus on: <span className="font-semibold">{weakDomains.slice(0, 3).map(([d]) => d).join(', ')}</span>.</span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-5">
                <Button onClick={handleRestartExam} className="flex-1 min-w-[120px]">
                  🔄 Retake Exam
                </Button>
                <Button onClick={() => setCurrentPage(PAGES.EXAM)} className="flex-1 min-w-[120px] bg-slate-600 hover:bg-slate-500">
                  👁 Review Answers
                </Button>
                {passed && user && (
                  <Button
                    onClick={() => {
                      setCertExamType(currentExamType);
                      setCertScore(score.correct);
                      setCertTotal(score.total);
                      setCertPercentage(score.percentage);
                      setShowCertificate(true);
                    }}
                    className="flex-1 min-w-[120px] bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                  >
                    🎓 View Certificate
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Domain Performance Breakdown ── */}
          {sortedDomains.length > 0 && (
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-white">📊 Domain Performance</h3>
              <div className="space-y-3">
                {sortedDomains.map(([domain, stats]) => {
                  const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                  const isWeak = pct < 60;
                  const isMid = pct >= 60 && pct < 80;
                  const barColor = isWeak ? 'bg-red-500' : isMid ? 'bg-amber-500' : 'bg-emerald-500';
                  const textColor = isWeak ? 'text-red-400' : isMid ? 'text-amber-400' : 'text-emerald-400';
                  const badge = isWeak ? '❌ Needs Work' : isMid ? '⚠ Improve' : '✅ Strong';
                  return (
                    <div key={domain}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="text-slate-200 font-medium truncate max-w-[55%]">{domain}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs ${textColor}`}>{badge}</span>
                          <span className="text-slate-300 font-semibold">{pct}%</span>
                          <span className="text-slate-500 text-xs">({stats.correct}/{stats.total})</span>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Improvement Recommendations ── */}
          {weakDomains.length > 0 && (
            <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-3 text-white">💡 What to Study Next</h3>
              <ul className="space-y-2">
                {weakDomains.slice(0, 5).map(([domain, stats]) => {
                  const pct = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <li key={domain} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span>
                        <span className="font-semibold text-white">{domain}</span>
                        {' '}— you got {pct}% ({stats.correct}/{stats.total}). Review this domain's concepts and retry those questions.
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ── Question Navigation Grid ── */}
          <div className="bg-slate-800 rounded-2xl shadow-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-white">Question Navigator</h3>
            <div className="flex flex-wrap gap-1.5">
              {questions.map((q, index) => {
                const userAnswer = userAnswers[q.id];
                let cls = "w-9 h-9 rounded-md text-xs font-semibold transition-colors ";
                if (userAnswer?.isCorrect) {
                  cls += "bg-emerald-600 text-white";
                } else if (userAnswer?.timedOut) {
                  cls += "bg-amber-600 text-white";
                } else if (userAnswer?.attempted) {
                  cls += "bg-red-600 text-white";
                } else {
                  cls += "bg-slate-600 text-slate-300";
                }
                return (
                  <button
                    key={index}
                    title={`Q${index + 1}${userAnswer?.isCorrect ? ' ✓' : userAnswer?.timedOut ? ' ⏱' : userAnswer?.attempted ? ' ✗' : ' –'}`}
                    onClick={() => handleReviewNavigation(index)}
                    className={cls}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 text-xs text-slate-400">
              <span><span className="inline-block w-3 h-3 rounded-sm bg-emerald-600 mr-1" />Correct</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-red-600 mr-1" />Incorrect</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-amber-600 mr-1" />Timed Out</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-slate-600 mr-1" />Not Attempted</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress and Timer */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <div className={`text-lg font-bold ${timeRemaining <= 30 ? 'text-red-400' : 'text-sky-400'}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-800 rounded-lg shadow-lg p-6">
          {/* Difficulty and Domain Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
            <DomainBadge domain={currentQuestion.domain} />
          </div>
          
          <h3 className="text-lg font-medium mb-6 leading-relaxed">
            {currentQuestion.questionText || currentQuestion.question}
          </h3>
          
          <div className="space-y-3">
            {Array.isArray(currentQuestion.options) 
              ? currentQuestion.options.map((option) => {
                  let buttonClass = "w-full text-left p-4 rounded-md border transition-all duration-200 ";
                  
                  if (showFeedback) {
                    if (option.letter === currentQuestion.correctAnswerLetter) {
                      buttonClass += "bg-green-700 border-green-600 text-white";
                    } else if (option.letter === selectedAnswerLetter && option.letter !== currentQuestion.correctAnswerLetter) {
                      buttonClass += "bg-red-700 border-red-600 text-white";
                    } else {
                      buttonClass += "bg-slate-700 border-slate-600 text-slate-300";
                    }
                  } else {
                    if (option.letter === selectedAnswerLetter) {
                      buttonClass += "bg-sky-700 border-sky-600 text-white";
                    } else {
                      buttonClass += "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600";
                    }
                  }

                  return (
                    <button
                      key={option.letter}
                      className={buttonClass}
                      onClick={() => handleAnswerSelect(option.letter)}
                      disabled={showFeedback && isReviewMode}
                    >
                      <span className="font-semibold mr-3">{option.letter}.</span>
                      {option.text}
                    </button>
                  );
                })
              : Object.entries(currentQuestion.options as { [key: string]: string }).map(([letter, text]) => {
                  let buttonClass = "w-full text-left p-4 rounded-md border transition-all duration-200 ";
                  
                  if (showFeedback) {
                    if (letter === currentQuestion.correctAnswerLetter) {
                      buttonClass += "bg-green-700 border-green-600 text-white";
                    } else if (letter === selectedAnswerLetter && letter !== currentQuestion.correctAnswerLetter) {
                      buttonClass += "bg-red-700 border-red-600 text-white";
                    } else {
                      buttonClass += "bg-slate-700 border-slate-600 text-slate-300";
                    }
                  } else {
                    if (letter === selectedAnswerLetter) {
                      buttonClass += "bg-sky-700 border-sky-600 text-white";
                    } else {
                      buttonClass += "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600";
                    }
                  }

                  return (
                    <button
                      key={letter}
                      className={buttonClass}
                      onClick={() => handleAnswerSelect(letter)}
                      disabled={showFeedback && isReviewMode}
                    >
                      <span className="font-semibold mr-3">{letter}.</span>
                      {text}
                    </button>
                  );
                })
            }
          </div>

          {/* Feedback Section */}
          {showFeedback && (
            <div className="mt-6 p-4 bg-slate-700 rounded-md">
              <div className="flex items-center mb-3">
                {userAnswers[currentQuestion.id]?.timedOut ? (
                  <>
                    <XCircle className="w-5 h-5 text-orange-400 mr-2" />
                    <span className="font-semibold text-orange-400">Time's Up!</span>
                  </>
                ) : userAnswers[currentQuestion.id]?.isCorrect ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <span className="font-semibold text-green-400">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400 mr-2" />
                    <span className="font-semibold text-red-400">Incorrect</span>
                  </>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>Correct Answer: {currentQuestion.correctAnswerLetter}</strong><br />
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            {!showFeedback ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswerLetter}
                className="flex-1"
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                onClick={handleNextQuestion}
                className="flex-1"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContactPage = () => {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <img 
            src="/profile-image.png" 
            alt="Profile" 
            className="w-32 h-32 rounded-full mx-auto border-4 border-sky-500 shadow-lg object-cover mb-4"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='%23e5e7eb' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
            }}
          />
          
          {/* Social Media Links */}
          <div className="flex justify-center space-x-6 mb-4">
            <a
              href="https://github.com/theabstact237"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="GitHub"
              onClick={() => analytics.socialMediaClicked('github')}
            >
              <FontAwesomeIcon icon={faGithub} size="2x" />
            </a>
            <a
              href="https://linkedin.com/in/siaka-karl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors"
              title="LinkedIn"
              onClick={() => analytics.socialMediaClicked('linkedin')}
            >
              <FontAwesomeIcon icon={faLinkedin} size="2x" />
            </a>
          </div>
          
          <h2 className="text-xl font-bold mt-4 text-white">Karl Siaka</h2>
          <p className="text-slate-300">AWS Solutions Architect & Cloud Practitioner</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Contact Me</h2>
            
            {formSubmitted ? (
              <div className="bg-green-700 text-white p-4 rounded-md mb-4">
                Thank you for your message! I'll get back to you soon.
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} action="https://formspree.io/f/your_formspree_id" method="POST">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone (Optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    ></textarea>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </div>
              </form>
            )}
          </div>
          
          {/* Support Options */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Support My Work</h2>
            
            {/* Payment Tabs */}
            <div className="flex border-b border-slate-700 mb-4">
              {[
                { id: 'cashapp', label: 'Cash App', color: 'text-green-400' },
                { id: 'venmo', label: 'Venmo', color: 'text-blue-400' },
                { id: 'paypal', label: 'PayPal', color: 'text-sky-400' },
                { id: 'zelle', label: 'Zelle', color: 'text-purple-400' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    analytics.paymentTabClicked(tab.id);
                    setActivePaymentTab(tab.id);
                  }}
                  className={`px-4 py-2 font-medium ${
                    activePaymentTab === tab.id 
                      ? `${tab.color} border-b-2 border-current` 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Payment Content */}
            {activePaymentTab === 'cashapp' && (
              <div className="p-4 bg-slate-700 rounded-md">
                <h3 className="text-green-400 font-semibold mb-2">Cash App</h3>
                <p className="mb-4">Support me with Cash App using my $Cashtag:</p>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value="$theabstract237"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('$theabstract237')}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-r-md"
                  >
                    {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                  </button>
                </div>
                <a
                  href="https://cash.app/$theabstract237"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-md"
                  onClick={() => analytics.paymentLinkClicked('cashapp')}
                >
                  Open Cash App
                </a>
              </div>
            )}
            
            {activePaymentTab === 'venmo' && (
              <div className="p-4 bg-slate-700 rounded-md">
                <h3 className="text-blue-400 font-semibold mb-2">Venmo</h3>
                <p className="mb-4">Send money directly with Venmo:</p>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value="@karl-siaka"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('@karl-siaka')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md"
                  >
                    {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            
            {activePaymentTab === 'paypal' && (
              <div className="p-4 bg-slate-700 rounded-md">
                <h3 className="text-sky-400 font-semibold mb-2">PayPal</h3>
                <p className="mb-4">Support me with PayPal:</p>
                <a
                  href="https://paypal.me/SiakaKarl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-sky-600 hover:bg-sky-700 text-white text-center py-2 rounded-md mb-4"
                  onClick={() => analytics.paymentLinkClicked('paypal')}
                >
                  PayPal.me/SiakaKarl
                </a>
              </div>
            )}
            
            {activePaymentTab === 'zelle' && (
              <div className="p-4 bg-slate-700 rounded-md">
                <h3 className="text-purple-400 font-semibold mb-2">Zelle</h3>
                <p className="mb-4">Send money with Zelle using:</p>
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value="siakatayoukarlwilliam@gmail.com"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('siakatayoukarlwilliam@gmail.com')}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-r-md"
                  >
                    {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button
              onClick={() => {
                if (examInProgress && !isReviewMode) {
                  setShowExamInProgressModal(true);
                } else {
                  setCurrentPage(PAGES.HOME);
                }
              }}
              className="text-xl font-bold text-sky-400 hover:text-sky-300 transition-colors focus:outline-none shrink-0"
              title="Go to Home"
            >
              FreeCertify
            </button>

            {/* ── Desktop Navigation (lg+) ── */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Exam Type Selector */}
              {[
                { type: EXAM_TYPES.SOLUTIONS_ARCHITECT, label: 'Solutions Architect' },
                { type: EXAM_TYPES.CLOUD_PRACTITIONER, label: 'Cloud Practitioner' },
                { type: EXAM_TYPES.DEVELOPER, label: 'Developer' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleExamTypeChange(type)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentExamType === type ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}

              <div className="w-px h-5 bg-slate-600 mx-1" />

              <button
                onClick={() => { analytics.pageChanged(currentPage, PAGES.EXAM); setCurrentPage(PAGES.EXAM); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === PAGES.EXAM ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Home className="w-4 h-4" />
                Exam
              </button>

              <button
                onClick={() => { analytics.pageChanged(currentPage, PAGES.CONTACT); setCurrentPage(PAGES.CONTACT); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === PAGES.CONTACT ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Mail className="w-4 h-4" />
                Contact
              </button>

              {user && (
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  AI Assistant
                </button>
              )}

              {user && (
                <button
                  onClick={() => setShowAnalyticsDashboard(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </button>
              )}

              <div className="w-px h-5 bg-slate-600 mx-1" />

              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    title="My Profile"
                  >
                    {displayPhoto
                      ? <img src={displayPhoto} alt="Profile" className="w-8 h-8 rounded-full border border-sky-500/40" />
                      : <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                    }
                    <span className="text-slate-300 text-sm max-w-[110px] truncate">{displayName}</span>
                  </button>
                  <button onClick={handleSignOut} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>

            {/* ── Mobile right: avatar + hamburger (< lg) ── */}
            <div className="flex lg:hidden items-center gap-2">
              {user && (
                <button onClick={() => setShowProfileModal(true)} title="My Profile" className="hover:opacity-80 transition-opacity">
                  {displayPhoto
                    ? <img src={displayPhoto} alt="Profile" className="w-8 h-8 rounded-full border border-sky-500/40" />
                    : <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
                  }
                </button>
              )}
              <button
                onClick={() => { analytics.mobileMenuToggled(!mobileMenuOpen); setMobileMenuOpen(!mobileMenuOpen); }}
                className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Drawer (< lg) ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-700 bg-slate-800">
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">

              {/* User greeting */}
              {user ? (
                <button
                  onClick={() => { setShowProfileModal(true); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-700/60 hover:bg-slate-700 rounded-xl w-full text-left transition-colors"
                >
                  {displayPhoto
                    ? <img src={displayPhoto} alt="Profile" className="w-9 h-9 rounded-full border border-sky-500/50" />
                    : <div className="w-9 h-9 bg-sky-600 rounded-full flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-sky-400 shrink-0">View Profile →</span>
                </button>
              ) : (
                <button
                  onClick={() => { setShowLoginModal(true); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold transition-colors mb-2"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {/* Section: Exam Type */}
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Exam Type</p>
              {[
                { type: EXAM_TYPES.SOLUTIONS_ARCHITECT, label: 'AWS Solutions Architect' },
                { type: EXAM_TYPES.CLOUD_PRACTITIONER, label: 'AWS Cloud Practitioner' },
                { type: EXAM_TYPES.DEVELOPER, label: 'AWS Developer Associate' },
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => { handleExamTypeChange(type); setMobileMenuOpen(false); }}
                  className={`flex items-center w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    currentExamType === type ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}

              {/* Section: Navigation */}
              <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Navigation</p>

              <button
                onClick={() => { setCurrentPage(PAGES.HOME); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors ${currentPage === PAGES.HOME ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Home className="w-5 h-5 shrink-0" />
                Home
              </button>

              <button
                onClick={() => { analytics.pageChanged(currentPage, PAGES.EXAM); setCurrentPage(PAGES.EXAM); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors ${currentPage === PAGES.EXAM ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Home className="w-5 h-5 shrink-0" />
                Practice Exam
              </button>

              <button
                onClick={() => { analytics.pageChanged(currentPage, PAGES.CONTACT); setCurrentPage(PAGES.CONTACT); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors ${currentPage === PAGES.CONTACT ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
              >
                <Mail className="w-5 h-5 shrink-0" />
                Contact & Support
              </button>

              {/* Section: Tools (logged-in only) */}
              {user && (
                <>
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tools</p>
                  <button
                    onClick={() => { setShowAIAssistant(true); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20 transition-colors"
                  >
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    AI Study Assistant
                  </button>
                  <button
                    onClick={() => { setShowAnalyticsDashboard(true); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5 shrink-0" />
                    Analytics Dashboard
                  </button>
                </>
              )}

              {/* Sign Out */}
              {user && (
                <div className="pt-2 border-t border-slate-700">
                  <button
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    Sign Out
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {(currentPage === PAGES.EXAM || currentPage === PAGES.REVIEW) ? getExamTitle() : 'Contact & Support'}
            </h1>
            {(currentPage === PAGES.EXAM || currentPage === PAGES.REVIEW) && (
              <p className="text-slate-400">
                {isReviewMode ? 'Exam Results & Review' : 'Test your knowledge with our practice questions'}
              </p>
            )}
          </div>
          
          {/* Page Content */}
          {(currentPage === PAGES.EXAM || currentPage === PAGES.REVIEW) && renderExamPage()}
          {currentPage === PAGES.CONTACT && renderContactPage()}
        </div>
      </main>
      
      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard 
        isVisible={showAnalyticsDashboard}
        onClose={() => setShowAnalyticsDashboard(false)}
      />

      {/* User Profile Modal */}
      {user && (
        <UserProfileModal
          isVisible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          onViewCertificate={handleProfileCertificate}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      
      {/* Login Modal */}
      <LoginModal
        isVisible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        questionNumber={currentQuestionIndex + 1}
        examType={currentExamType}
      />

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isVisible={showAIAssistant}
        loading={assistantLoading}
        chatLoading={assistantChatLoading}
        error={assistantError}
        statusMsg={assistantStatusMsg}
        selectedSyllabus={selectedSyllabus}
        lecturePlan={lecturePlan}
        chatMessages={assistantChatMessages}
        chatInput={assistantChatInput}
        isPinned={assistantPinned}
        onClose={() => setShowAIAssistant(false)}
        onSelectSyllabus={handleSyllabusSelection}
        onChatInputChange={setAssistantChatInput}
        onSendMessage={handleAssistantSendMessage}
        onQuickPromptSend={handleAssistantQuickPrompt}
        onTogglePin={handleToggleAssistantPin}
      />
      
      {/* Exam In Progress Modal */}
      <ExamInProgressModal
        isVisible={showExamInProgressModal}
        onClose={() => setShowExamInProgressModal(false)}
        onContinueExam={handleContinueExam}
        onAbandonExam={handleAbandonExam}
        userName={displayName}
        currentExamType={currentExamType}
        currentProgress={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />
      
      {/* Certificate Modal */}
      <Certificate
        isVisible={showCertificate}
        onClose={() => setShowCertificate(false)}
        userName={displayName}
        examType={certExamType || currentExamType}
        score={certScore}
        totalQuestions={certTotal}
        percentage={certPercentage}
        completionDate={examCompletionDate}
      />

      {/* Review Modal - shown after exam completion, before certificate */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={handleReviewClose}
        onSubmit={handleReviewSubmit}
        examName={getExamTitle()}
        examId={currentExamId}
        examScore={lastExamScore}
        passed={lastExamPassed}
        user={user ? {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        } : null}
        userDisplayName={displayName}
        userDisplayPhoto={displayPhoto}
      />
    </div>
  );
}

export default App;

