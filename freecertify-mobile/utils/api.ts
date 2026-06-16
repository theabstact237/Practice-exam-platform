/**
 * API utility — all calls to the FreeCertify Django backend.
 * Reused from the web app with React Native fetch compatibility.
 */
import axios from 'axios';
import { API_BASE_URL, apiRequestHeaders } from '../config/api';

export { API_BASE_URL, checkBackendReachable } from '../config/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
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

// ── AI Assistant (same Django endpoints as web — provider-agnostic branding) ───

export interface SyllabusLecture {
  title: string;
  focus: string;
  duration_minutes: number;
  resources: string[];
  hands_on_lab: string;
}

export interface SyllabusLecturePlan {
  syllabus: string;
  syllabus_label: string;
  provider: string;
  overview: string;
  lectures: SyllabusLecture[];
}

export interface AssistantChatMessage {
  role: 'user' | 'assistant';
  content: string;
  off_topic?: boolean;
}

export interface AssistantChatResponse {
  syllabus: string;
  provider: string;
  reply: string;
  off_topic?: boolean;
}

export const getSyllabusLectures = async (
  syllabus: string,
  onRetry?: () => void,
): Promise<SyllabusLecturePlan> => {
  const attempt = async (timeoutMs: number) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assistant/syllabus-lectures/`, {
        method: 'POST',
        headers: apiRequestHeaders(),
        body: JSON.stringify({ syllabus }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as SyllabusLecturePlan;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  try {
    return await attempt(65_000);
  } catch (firstError) {
    const isFetchFail =
      firstError instanceof TypeError ||
      (firstError instanceof Error && firstError.name === 'AbortError');

    if (isFetchFail) {
      onRetry?.();
      await new Promise(res => setTimeout(res, 4000));
      return await attempt(65_000);
    }
    throw firstError;
  }
};

export const chatWithSyllabusAssistant = async (
  syllabus: string,
  message: string,
  lectures: SyllabusLecture[],
  history: AssistantChatMessage[] = [],
): Promise<AssistantChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/assistant/chat/`, {
    method: 'POST',
    headers: apiRequestHeaders(),
    body: JSON.stringify({ syllabus, message, lectures, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Stream chat responses token-by-token (SSE). Falls back to non-streaming if needed.
 */
export const streamChatWithSyllabusAssistant = async (
  syllabus: string,
  message: string,
  lectures: SyllabusLecture[],
  history: AssistantChatMessage[],
  onDelta: (delta: string) => void,
  onDone: (offTopic: boolean) => void,
  onError: (error: string) => void,
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/assistant/chat/stream/`, {
    method: 'POST',
    headers: apiRequestHeaders(),
    body: JSON.stringify({ syllabus, message, lectures, history }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    onError(errorData.error || `HTTP error! status: ${response.status}`);
    return;
  }

  if (!response.body) {
    try {
      const result = await chatWithSyllabusAssistant(syllabus, message, lectures, history);
      onDelta(result.reply);
      onDone(!!result.off_topic);
    } catch (e: any) {
      onError(e?.message || 'Assistant request failed.');
    }
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.off_topic) {
          if (parsed.reply) onDelta(parsed.reply);
          onDone(true);
          return;
        }
        if (parsed.done) {
          onDone(false);
          return;
        }
        if (parsed.delta) {
          onDelta(parsed.delta);
        }
      } catch {
        // skip malformed chunk
      }
    }
  }
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
