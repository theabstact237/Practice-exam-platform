/**
 * Prompt Engineering Adventure — 14-chapter gamified curriculum.
 * Domain codes: CH01–CH14 (matches backend/prompt_engineering_100_questions.json).
 * All 100 questions are MCQ.
 */

export interface PromptEngUnit {
  id: string;
  code: string;
  title: string;
  chapter: number;
  xp: number;
  prerequisites: string[];
}

export const PROMPT_ENG_CHAPTERS = [
  { id: 1, title: 'The Basics', emoji: '🎮' },
  { id: 2, title: 'Core Techniques', emoji: '🧱' },
  { id: 3, title: 'Reasoning Patterns', emoji: '🔁' },
  { id: 4, title: 'Advanced Control', emoji: '📦' },
  { id: 5, title: 'Expert Level', emoji: '🏆' },
] as const;

export const PROMPT_ENG_UNITS: PromptEngUnit[] = [
  { id: 'prompt_unit_1',  code: 'CH01', title: 'What is Prompt Engineering?', chapter: 1, xp: 10, prerequisites: [] },
  { id: 'prompt_unit_2',  code: 'CH02', title: 'Anatomy of a Prompt',         chapter: 1, xp: 10, prerequisites: ['prompt_unit_1'] },
  { id: 'prompt_unit_3',  code: 'CH03', title: 'Instruction Clarity',          chapter: 1, xp: 10, prerequisites: ['prompt_unit_2'] },
  { id: 'prompt_unit_4',  code: 'CH04', title: 'Roles & Personas',             chapter: 2, xp: 12, prerequisites: ['prompt_unit_3'] },
  { id: 'prompt_unit_5',  code: 'CH05', title: 'Zero-shot vs Few-shot',         chapter: 2, xp: 12, prerequisites: ['prompt_unit_4'] },
  { id: 'prompt_unit_6',  code: 'CH06', title: 'Chain-of-Thought Prompting',   chapter: 3, xp: 14, prerequisites: ['prompt_unit_5'] },
  { id: 'prompt_unit_7',  code: 'CH07', title: 'Output Formatting',            chapter: 3, xp: 14, prerequisites: ['prompt_unit_6'] },
  { id: 'prompt_unit_8',  code: 'CH08', title: 'Context & Memory Limits',      chapter: 4, xp: 16, prerequisites: ['prompt_unit_7'] },
  { id: 'prompt_unit_9',  code: 'CH09', title: 'Temperature & Parameters',     chapter: 4, xp: 16, prerequisites: ['prompt_unit_8'] },
  { id: 'prompt_unit_10', code: 'CH10', title: 'Prompt Injection & Safety',    chapter: 4, xp: 16, prerequisites: ['prompt_unit_9'] },
  { id: 'prompt_unit_11', code: 'CH11', title: 'Iterative Refinement',         chapter: 5, xp: 18, prerequisites: ['prompt_unit_10'] },
  { id: 'prompt_unit_12', code: 'CH12', title: 'RAG & Grounding',              chapter: 5, xp: 20, prerequisites: ['prompt_unit_11'] },
  { id: 'prompt_unit_13', code: 'CH13', title: 'AI Agents & Tool Use',         chapter: 5, xp: 22, prerequisites: ['prompt_unit_12'] },
  { id: 'prompt_unit_14', code: 'CH14', title: 'Master Prompt Engineer',       chapter: 5, xp: 25, prerequisites: ['prompt_unit_13'] },
];

export const getPromptEngUnitById = (unitId: string): PromptEngUnit | undefined =>
  PROMPT_ENG_UNITS.find(u => u.id === unitId);
