import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Mail, Menu, X, BarChart3, User, LogOut } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { signOutUser, updateUserProgress } from './utils/auth';
import { initGA, analytics, setUserProperties } from './utils/analytics';
import { getOrGenerateExamQuestions, Question as APIQuestion, preGenerateExamQuestions, getReviews, submitReview, Review } from './utils/api';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginModal from './components/LoginModal';
import HomePage from './components/HomePage';
import Certificate from './components/Certificate';
import ExamInProgressModal from './components/ExamInProgressModal';
import ReviewModal, { ReviewData } from './components/ReviewModal';
import { Testimonial } from './components/TestimonialsCarousel';

// Define page types for navigation
const PAGES = {
  HOME: 'home',
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

  // Exam lock state - prevent switching during active exam
  const [examInProgress, setExamInProgress] = useState(false);
  const [showExamInProgressModal, setShowExamInProgressModal] = useState(false);
  const [pendingExamType, setPendingExamType] = useState<string | null>(null);

  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false);
  const [examCompletionDate, setExamCompletionDate] = useState<Date>(new Date());

  // Review/Testimonial state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pendingCertificate, setPendingCertificate] = useState(false);
  const [lastExamScore, setLastExamScore] = useState(0);
  const [lastExamPassed, setLastExamPassed] = useState(false);
  const [currentExamId, setCurrentExamId] = useState(1);

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

  // Fetch testimonials for homepage
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const reviews = await getReviews(20);
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
      if (nextQuestionIndex === 25 && !user && !hasShownLoginPrompt) {
        setShowLoginModal(true);
        setHasShownLoginPrompt(true);
        analytics.paymentTabClicked('login_prompt_shown');
        return; // Don't advance to next question yet
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
      
      analytics.examCompleted(currentExamType, score, questions.length, totalTime);
      
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
      
      // Map exam type to exam ID
      const examIdMap: { [key: string]: number } = {
        [EXAM_TYPES.SOLUTIONS_ARCHITECT]: 1,
        [EXAM_TYPES.CLOUD_PRACTITIONER]: 2,
        [EXAM_TYPES.DEVELOPER]: 3
      };
      setCurrentExamId(examIdMap[currentExamType] || 1);
      
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
      await submitReview(reviewData);
      console.log('Review submitted successfully');
      
      // Refresh testimonials
      const reviews = await getReviews(20);
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
      console.error('Error submitting review:', error);
    }
    
    // Close review modal and show certificate if pending
    setShowReviewModal(false);
    if (pendingCertificate) {
      setShowCertificate(true);
      setPendingCertificate(false);
    }
  };

  // Handle review modal close (skip)
  const handleReviewClose = () => {
    setShowReviewModal(false);
    if (pendingCertificate) {
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
    // Reset login prompt state so it can be shown again if needed
    setHasShownLoginPrompt(false);
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

  // Handle exam selection with pre-generation
  const handleExamSelection = async (examType: string) => {
    // Check if exam is in progress and user is trying to switch
    if (examInProgress && examType !== currentExamType && !isReviewMode) {
      setPendingExamType(examType);
      setShowExamInProgressModal(true);
      return;
    }
    
    setIsPreGenerating(true);
    setCurrentExamType(examType);
    setCurrentPage(PAGES.EXAM);
    
    // Map frontend exam types to backend exam types
    const examTypeMap: { [key: string]: string } = {
      [EXAM_TYPES.SOLUTIONS_ARCHITECT]: 'solutions_architect',
      [EXAM_TYPES.CLOUD_PRACTITIONER]: 'cloud_practitioner',
      [EXAM_TYPES.DEVELOPER]: 'developer'
    };

    const backendExamType = examTypeMap[examType] || examType;
    
    try {
      // Pre-generate questions when user clicks exam tab
      console.log(`Pre-generating questions for ${backendExamType}...`);
      await preGenerateExamQuestions(backendExamType, 50, true); // Use Manus API
      console.log('Pre-generation complete!');
    } catch (error) {
      console.error('Error pre-generating questions:', error);
      // Continue anyway - questions might already exist
    } finally {
      setIsPreGenerating(false);
      // Questions will load via useEffect when currentExamType changes
    }
  };

  // Show home page if not on exam page
  if (currentPage === PAGES.HOME) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <HomePage 
          onSelectExam={handleExamSelection}
          user={user}
          testimonials={testimonials}
        />
        
        {/* Exam In Progress Modal - also shown on homepage */}
        <ExamInProgressModal
          isVisible={showExamInProgressModal}
          onClose={() => setShowExamInProgressModal(false)}
          onContinueExam={handleContinueExam}
          onAbandonExam={handleAbandonExam}
          userName={user?.displayName || user?.email?.split('@')[0] || 'Student'}
          currentExamType={currentExamType}
          currentProgress={currentQuestionIndex + 1}
          totalQuestions={questions.length || 50}
        />
      </div>
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
      
      return (
        <div className="max-w-4xl mx-auto">
          {/* Score Summary */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Exam Complete!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-sky-400">{score.correct}</div>
                <div className="text-slate-400">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{score.total - score.correct}</div>
                <div className="text-slate-400">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{score.percentage}%</div>
                <div className="text-slate-400">Score</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleRestartExam} className="flex-1">
                Retake Exam
              </Button>
              <Button onClick={() => setCurrentPage(PAGES.EXAM)} className="flex-1">
                Continue Review
              </Button>
              {score.percentage >= 70 && user && (
                <Button 
                  onClick={() => setShowCertificate(true)} 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
                >
                  🎓 View Certificate
                </Button>
              )}
            </div>
            
            {/* Pass/Fail Banner */}
            {score.percentage >= 70 ? (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 rounded-lg text-center">
                <p className="text-emerald-400 text-lg font-semibold">
                  🎉 Congratulations! You Passed! 🎉
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  You scored {score.percentage}% - above the 70% passing threshold!
                </p>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-600/20 to-amber-500/20 border border-amber-500/30 rounded-lg text-center">
                <p className="text-amber-400 text-lg font-semibold">
                  📚 Keep Practicing!
                </p>
                <p className="text-slate-300 text-sm mt-1">
                  You need 70% to pass. Review the questions and try again!
                </p>
              </div>
            )}
          </div>

          {/* Question Navigation */}
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Question Navigation</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {questions.map((_, index) => {
                const questionId = questions[index].id;
                const userAnswer = userAnswers[questionId];
                let buttonClass = "w-10 h-10 rounded-md text-sm font-medium ";
                
                if (index === currentQuestionIndex) {
                  buttonClass += "bg-sky-600 text-white";
                } else if (userAnswer?.isCorrect) {
                  buttonClass += "bg-green-600 text-white";
                } else if (userAnswer?.attempted) {
                  buttonClass += "bg-red-600 text-white";
                } else {
                  buttonClass += "bg-slate-600 text-slate-300";
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleReviewNavigation(index)}
                    className={buttonClass}
                  >
                    {index + 1}
                  </button>
                );
              })}
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
      <nav className="bg-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-sky-400">AWS Practice Exams</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Exam Type Selector */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExamTypeChange(EXAM_TYPES.SOLUTIONS_ARCHITECT)}
                  className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    currentExamType === EXAM_TYPES.SOLUTIONS_ARCHITECT
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Solutions Architect
                </button>
                <button
                  onClick={() => handleExamTypeChange(EXAM_TYPES.CLOUD_PRACTITIONER)}
                  className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    currentExamType === EXAM_TYPES.CLOUD_PRACTITIONER
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Cloud Practitioner
                </button>
                <button
                  onClick={() => handleExamTypeChange(EXAM_TYPES.DEVELOPER)}
                  className={`px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                    currentExamType === EXAM_TYPES.DEVELOPER
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Developer
                </button>
              </div>
              
              {/* Page Navigation */}
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    analytics.pageChanged(currentPage, PAGES.EXAM);
                    setCurrentPage(PAGES.EXAM);
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === PAGES.EXAM
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Exam
                </button>
                <button
                  onClick={() => {
                    analytics.pageChanged(currentPage, PAGES.CONTACT);
                    setCurrentPage(PAGES.CONTACT);
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === PAGES.CONTACT
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </button>
                <button
                  onClick={() => setShowAnalyticsDashboard(true)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  title="View Analytics"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </button>
              </div>
              
              {/* User Authentication */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-slate-300 text-sm hidden md:block">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-2 py-1 text-slate-400 hover:text-white transition-colors"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => {
                  analytics.mobileMenuToggled(!mobileMenuOpen);
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Exam Type Selector */}
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exam Type</p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      handleExamTypeChange(EXAM_TYPES.SOLUTIONS_ARCHITECT);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentExamType === EXAM_TYPES.SOLUTIONS_ARCHITECT
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    Solutions Architect
                  </button>
                  <button
                    onClick={() => {
                      handleExamTypeChange(EXAM_TYPES.CLOUD_PRACTITIONER);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentExamType === EXAM_TYPES.CLOUD_PRACTITIONER
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    Cloud Practitioner
                  </button>
                  <button
                    onClick={() => {
                      handleExamTypeChange(EXAM_TYPES.DEVELOPER);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      currentExamType === EXAM_TYPES.DEVELOPER
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600'
                    }`}
                  >
                    Developer
                  </button>
                </div>
              </div>
              
              {/* Page Navigation */}
              <button
                onClick={() => {
                  setCurrentPage(PAGES.HOME);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === PAGES.HOME
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage(PAGES.EXAM);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === PAGES.EXAM
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                Exam
              </button>
              <button
                onClick={() => {
                  setCurrentPage(PAGES.CONTACT);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === PAGES.CONTACT
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600'
                }`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </button>
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
              {currentPage === PAGES.EXAM ? getExamTitle() : 'Contact & Support'}
            </h1>
            {currentPage === PAGES.EXAM && (
              <p className="text-slate-400">
                {isReviewMode ? 'Review Mode - Navigate through your answers' : 'Test your knowledge with our practice questions'}
              </p>
            )}
          </div>
          
          {/* Page Content */}
          {currentPage === PAGES.EXAM && renderExamPage()}
          {currentPage === PAGES.CONTACT && renderContactPage()}
        </div>
      </main>
      
      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboard 
        isVisible={showAnalyticsDashboard}
        onClose={() => setShowAnalyticsDashboard(false)}
      />
      
      {/* Login Modal */}
      <LoginModal
        isVisible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
        questionNumber={currentQuestionIndex + 1}
        examType={currentExamType}
      />
      
      {/* Exam In Progress Modal */}
      <ExamInProgressModal
        isVisible={showExamInProgressModal}
        onClose={() => setShowExamInProgressModal(false)}
        onContinueExam={handleContinueExam}
        onAbandonExam={handleAbandonExam}
        userName={user?.displayName || user?.email?.split('@')[0] || 'Student'}
        currentExamType={currentExamType}
        currentProgress={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />
      
      {/* Certificate Modal */}
      <Certificate
        isVisible={showCertificate}
        onClose={() => setShowCertificate(false)}
        userName={user?.displayName || user?.email?.split('@')[0] || 'Student'}
        examType={currentExamType}
        score={calculateScore().correct}
        totalQuestions={calculateScore().total}
        percentage={calculateScore().percentage}
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
      />
    </div>
  );
}

export default App;

