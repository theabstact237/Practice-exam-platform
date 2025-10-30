import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Home, Mail, Menu, X, BarChart3, User, LogOut } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { signOutUser, updateUserProgress } from './utils/auth';
import { initGA, analytics, setUserProperties } from './utils/analytics';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LoginModal from './components/LoginModal';

// Define page types for navigation
const PAGES = {
  EXAM: 'exam',
  CONTACT: 'contact',
  REVIEW: 'review'
};

// Define exam types
const EXAM_TYPES = {
  SOLUTIONS_ARCHITECT: 'solutions_architect',
  CLOUD_PRACTITIONER: 'cloud_practitioner'
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

function App() {
  // State management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: UserAnswerRecord }>({});
  const [selectedAnswerLetter, setSelectedAnswerLetter] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentPage, setCurrentPage] = useState(PAGES.EXAM);
  const [currentExamType, setCurrentExamType] = useState(EXAM_TYPES.SOLUTIONS_ARCHITECT);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Load questions based on exam type
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const filename = currentExamType === EXAM_TYPES.CLOUD_PRACTITIONER 
          ? '/data/aws_cloud_practitioner_questions.json'
          : '/data/aws_questions.json';
        
        const response = await fetch(filename);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQuestions(data);
        
        // Reset exam state when switching exam types
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setSelectedAnswerLetter(null);
        setShowFeedback(false);
        setIsReviewMode(false);
        setTimeRemaining(90);
        setTimerActive(false);
        setQuestionStartTime(Date.now());
        
        // Track exam started
        analytics.examStarted(currentExamType);
        
      } catch (error) {
        console.error('Error loading questions:', error);
        analytics.questionLoadError(currentExamType, error instanceof Error ? error.message : 'Unknown error');
        setQuestions([]);
      }
    };

    loadQuestions();
  }, [currentExamType]);

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

  const handleExamTypeChange = (examType: string) => {
    // Track exam type change
    analytics.examTypeChanged(currentExamType, examType);
    
    setCurrentExamType(examType);
    setCurrentPage(PAGES.EXAM);
  };

  const getExamTitle = () => {
    return currentExamType === EXAM_TYPES.CLOUD_PRACTITIONER 
      ? 'AWS Cloud Practitioner Practice Exam'
      : 'AWS Solutions Architect Practice Exam';
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
      
      analytics.examCompleted(currentExamType, score, questions.length, totalTime);
      
      // Update final progress if authenticated
      if (user) {
        updateUserProgress(user.uid, currentExamType, questions.length);
      }
      
      setIsReviewMode(true);
      setCurrentPage(PAGES.REVIEW);
      setTimerActive(false);
      
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading questions...</p>
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
            <div className="flex gap-4">
              <Button onClick={handleRestartExam} className="flex-1">
                Retake Exam
              </Button>
              <Button onClick={() => setCurrentPage(PAGES.EXAM)} className="flex-1">
                Continue Review
              </Button>
            </div>
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
            src="/profile-image.jpg" 
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
              href="https://github.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
              title="GitHub"
              onClick={() => analytics.socialMediaClicked('github')}
            >
              <FontAwesomeIcon icon={faGithub} size="2x" />
            </a>
            <a
              href="https://linkedin.com/in/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors"
              title="LinkedIn"
              onClick={() => analytics.socialMediaClicked('linkedin')}
            >
              <FontAwesomeIcon icon={faLinkedin} size="2x" />
            </a>
            <a
              href="https://facebook.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-600 transition-colors"
              title="Facebook"
              onClick={() => analytics.socialMediaClicked('facebook')}
            >
              <FontAwesomeIcon icon={faFacebook} size="2x" />
            </a>
            <a
              href="https://instagram.com/yourusername"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-pink-400 transition-colors"
              title="Instagram"
              onClick={() => analytics.socialMediaClicked('instagram')}
            >
              <FontAwesomeIcon icon={faInstagram} size="2x" />
            </a>
          </div>
          
          <h2 className="text-xl font-bold mt-4 text-white">Your Name</h2>
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
                    value="$YourCashAppID"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('$YourCashAppID')}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-r-md"
                  >
                    {copySuccess === 'Copied!' ? copySuccess : 'Copy'}
                  </button>
                </div>
                <a
                  href="https://cash.app/$YourCashAppID"
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
                    value="@YourVenmoID"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('@YourVenmoID')}
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
                  href="https://paypal.me/YourPayPalID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-sky-600 hover:bg-sky-700 text-white text-center py-2 rounded-md mb-4"
                  onClick={() => analytics.paymentLinkClicked('paypal')}
                >
                  PayPal.me/YourPayPalID
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
                    value="your.email@example.com"
                    readOnly
                    className="flex-1 p-2 bg-slate-800 border border-slate-600 rounded-l-md"
                  />
                  <button
                    onClick={() => copyToClipboard('your.email@example.com')}
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
              <div className="flex space-x-4">
                <button
                  onClick={() => handleExamTypeChange(EXAM_TYPES.SOLUTIONS_ARCHITECT)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    currentExamType === EXAM_TYPES.SOLUTIONS_ARCHITECT
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Solutions Architect
                </button>
                <button
                  onClick={() => handleExamTypeChange(EXAM_TYPES.CLOUD_PRACTITIONER)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    currentExamType === EXAM_TYPES.CLOUD_PRACTITIONER
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  Cloud Practitioner
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
                </div>
              </div>
              
              {/* Page Navigation */}
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
                <Home className="w-4 h-4 mr-2" />
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
    </div>
  );
}

export default App;

