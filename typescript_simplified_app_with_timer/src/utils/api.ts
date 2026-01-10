// API Configuration
// In production (onrender.com), use the backend URL; otherwise use env var or localhost
const getApiBaseUrl = () => {
  // Auto-detect production on Render - most reliable method
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://aws-exam-backend.onrender.com/api';
  }
  
  // Check environment variable for other deployments
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // Ensure URL has https:// prefix
    if (!envUrl.startsWith('http://') && !envUrl.startsWith('https://')) {
      envUrl = `https://${envUrl}`;
    }
    // If it's a Render service name without domain, add .onrender.com
    if (!envUrl.includes('.') || envUrl.match(/^https?:\/\/[^.]+\//)) {
      envUrl = envUrl.replace(/^(https?:\/\/)([^\/]+)/, '$1$2.onrender.com');
    }
    return envUrl;
  }
  
  // Default to localhost for development
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface Exam {
  id: number;
  name: string;
  exam_type: string;
  description?: string;
  total_questions: number;
  time_limit_minutes: number;
  passing_score: number;
  is_active: boolean;
  questions_count?: number;
}

export interface Answer {
  id: number;
  letter: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  question_text?: string;
  question?: string;
  domain?: string;
  difficulty: string;
  explanation: string;
  answers: Answer[];
  options: Array<{ letter: string; text: string }>;
  correct_answer_letter: string;
}

export interface ExamWithQuestions extends Exam {
  questions: Question[];
}

/**
 * Get all exams
 */
export const getAllExams = async (): Promise<Exam[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Handle paginated response
    return data.results || data;
  } catch (error) {
    console.error('Error fetching all exams:', error);
    throw error;
  }
};

/**
 * Get exams by type
 */
export const getExamsByType = async (examType: string): Promise<Exam[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/by-type/${examType}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exams by type:', error);
    throw error;
  }
};

/**
 * Pre-generate questions when user clicks exam tab
 * This runs in the background before the exam starts
 */
export const preGenerateExamQuestions = async (
  examType: string,
  numQuestions: number = 50,
  useManus: boolean = true
): Promise<{ success: boolean; message: string; exam_id: number; current_count: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/pre-generate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        exam_type: examType,
        num_questions: numQuestions,
        use_manus: useManus,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error pre-generating exam questions:', error);
    throw error;
  }
};

/**
 * Get a specific exam with questions
 */
export const getExamWithQuestions = async (examId: number): Promise<ExamWithQuestions> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exam with questions:', error);
    throw error;
  }
};

/**
 * Get questions for an exam (random selection)
 */
export const getExamQuestions = async (examId: number, limit: number = 50): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/questions/?random=true&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    throw error;
  }
};

/**
 * Get random questions for an exam (from pool of 100)
 */
export const getRandomExamQuestions = async (examId: number, limit: number = 50): Promise<Question[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exams/${examId}/random-questions/?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.questions || data; // Handle both response formats
  } catch (error) {
    console.error('Error fetching random exam questions:', error);
    throw error;
  }
};

/**
 * Generate questions for an exam using AI
 */
export const generateExamQuestions = async (
  examId: number,
  numQuestions: number = 50,
  domain?: string,
  useManus: boolean = false,
  timeout: number = 30000 // 30 second timeout
): Promise<{ success: boolean; message: string; created_count: number }> => {
  return generateExamQuestionsWithPrompt(examId, numQuestions, domain, useManus, undefined, timeout);
};

/**
 * Generate questions for an exam using AI with a custom prompt
 */
export const generateExamQuestionsWithPrompt = async (
  examId: number,
  numQuestions: number = 50,
  domain?: string,
  useManus: boolean = false,
  prompt?: string,
  timeout: number = 30000 // 30 second timeout
): Promise<{ success: boolean; message: string; created_count: number }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const body: any = {
        num_questions: numQuestions,
        domain: domain,
        use_manus: useManus,
      };
      
      // Add prompt if provided
      if (prompt) {
        body.prompt = prompt;
      }
      
      const response = await fetch(`${API_BASE_URL}/exams/${examId}/generate-questions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Question generation timed out. Please try again.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating exam questions:', error);
    throw error;
  }
};

/**
 * Get exam questions from pre-loaded database
 * Fetches random questions from the existing pool (no AI generation needed)
 */
export const getOrGenerateExamQuestions = async (
  examType: string,
  numQuestions: number = 50,
  _useManus: boolean = true  // Kept for backwards compatibility, not used
): Promise<Question[]> => {
  try {
    // Get exams by type
    const exams = await getExamsByType(examType);
    
    if (exams.length === 0) {
      throw new Error(`No exam found for type: ${examType}`);
    }

    const exam = exams[0]; // Get the first exam of this type
    
    console.log(`Fetching ${numQuestions} random questions for ${exam.name}...`);

    // Fetch random questions from the pre-loaded database
    const questions = await getRandomExamQuestions(exam.id, numQuestions);
    
    if (questions.length === 0) {
      throw new Error(`No questions available for ${exam.name}. Please contact support.`);
    }

    console.log(`Successfully loaded ${questions.length} questions for ${exam.name}`);
    return questions;
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    throw error;
  }
};


// ============ REVIEWS API ============

export interface Review {
  id: number;
  exam: number;
  exam_name: string;
  exam_type: string;
  user_uid: string;
  user_name: string;
  user_photo_url: string;
  user_email: string;
  rating: number;
  comment: string;
  exam_score: number | null;
  passed: boolean | null;
  is_featured: boolean;
  created_at: string;
}

export interface ReviewCreateData {
  exam: number;
  user_uid: string;
  user_name: string;
  user_photo_url: string;
  user_email: string;
  rating: number;
  comment: string;
  exam_score?: number;
  passed?: boolean;
}

export const getReviews = async (limit: number = 20): Promise<Review[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const getRecentReviews = async (limit: number = 5): Promise<Review[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/recent/?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    return [];
  }
};

export const submitReview = async (reviewData: ReviewCreateData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

export const getReviewStats = async (): Promise<{ 
  total_reviews: number; 
  average_rating: number; 
  rating_distribution: Record<string, number> 
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/stats/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching review stats:', error);
    return { total_reviews: 0, average_rating: 0, rating_distribution: {} };
  }
};
