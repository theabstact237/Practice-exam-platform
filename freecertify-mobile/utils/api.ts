/**
 * API utility — all calls to the FreeCertify Django backend.
 * Reused from the web app with React Native fetch compatibility.
 */
import axios from 'axios';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Change this to your deployed backend URL for production builds.
const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://aws-exam-backend.onrender.com';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface APIQuestion {
  id: number;
  question_text: string;
  question?: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
  correct_answer_letter: string;
  answers: { letter: string; text: string; is_correct: boolean }[];
  options?: { letter: string; text: string }[];
}

export interface APIExam {
  id: number;
  name: string;
  exam_type: string;
  description: string;
  total_questions: number;
  passing_score: number;
  is_active: boolean;
}

export interface APIReview {
  id: number;
  user_name: string;
  user_photo_url: string;
  exam_name: string;
  rating: number;
  comment: string;
  passed: boolean;
  exam_score: number;
  created_at: string;
}

// ── Exam endpoints ─────────────────────────────────────────────────────────────

export const getExamsByType = async (examType: string): Promise<APIExam[]> => {
  const { data } = await api.get(`/api/exams/by-type/${examType}/`);
  return Array.isArray(data) ? data : [];
};

export const getRandomQuestions = async (
  examId: number,
  limit = 50,
): Promise<APIQuestion[]> => {
  const { data } = await api.get(
    `/api/exams/${examId}/random-questions/?limit=${limit}`,
  );
  return data.questions || [];
};

export const preGenerateQuestions = async (
  examType: string,
  numQuestions = 50,
): Promise<void> => {
  await api.post('/api/exams/pre-generate/', {
    exam_type: examType,
    num_questions: numQuestions,
    use_manus: true,
  });
};

// ── Review endpoints ───────────────────────────────────────────────────────────

export const getReviews = async (limit = 20): Promise<APIReview[]> => {
  const { data } = await api.get(`/api/reviews/?limit=${limit}`);
  return data.reviews || [];
};

export const submitReview = async (payload: {
  exam: number;
  user_uid: string;
  user_name: string;
  user_email?: string;
  user_photo_url?: string;
  rating: number;
  comment: string;
  exam_score?: number;
  passed?: boolean;
}): Promise<void> => {
  await api.post('/api/reviews/', payload);
};

// ── Attempt history ────────────────────────────────────────────────────────────

export const saveExamAttempt = async (payload: {
  user_uid: string;
  exam_type: string;
  exam_title: string;
  score_percent: number;
  correct: number;
  total: number;
  passed: boolean;
  time_taken_seconds: number;
  domain_scores: Record<string, { correct: number; total: number }>;
  question_results: object[];
}): Promise<void> => {
  await api.post('/api/attempts/', payload);
};

export const getUserAttempts = async (userUid: string) => {
  const { data } = await api.get(`/api/attempts/history/?user_uid=${userUid}`);
  return Array.isArray(data) ? data : [];
};

// ── AI Assistant ───────────────────────────────────────────────────────────────

export const getSyllabusLectures = async (syllabus: string) => {
  const { data } = await api.post('/api/assistant/syllabus-lectures/', {
    syllabus,
  });
  return data;
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const registerAnalyticsSession = async (
  sessionKey: string,
  deviceCategory: string,
): Promise<void> => {
  await api.post('/api/analytics/register-session/', {
    session_key: sessionKey,
    device_category: deviceCategory,
  });
};

export const recordAnalyticsEvent = async (
  sessionKey: string,
  examType: string,
  eventType: 'exam_start' | 'exam_complete',
  scorePercent?: number,
): Promise<void> => {
  await api.post('/api/analytics/record-event/', {
    session_key: sessionKey,
    exam_type: examType,
    event_type: eventType,
    score_percent: scorePercent,
  });
};
