/**
 * FreeCertify mobile AI tutor subjects — separate from web AWS certification tracks.
 */
import { SUBJECTS } from './subjects';

export interface TutorSyllabus {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tagline: string;
}

const MOBILE_TUTOR_IDS = new Set([
  'python',
  'javascript',
  'java',
  'prompt_engineering',
  'ai_fundamentals',
]);

export const TUTOR_SYLLABI: TutorSyllabus[] = SUBJECTS.filter(s =>
  MOBILE_TUTOR_IDS.has(s.id),
).map(s => ({
  id: s.id,
  name: s.name,
  emoji: s.emoji,
  color: s.color,
  tagline: s.tagline,
}));
