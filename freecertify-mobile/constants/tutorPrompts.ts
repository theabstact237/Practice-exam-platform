/** Quick prompts per subject — short label shown in UI, full message sent to the API. */

export interface TutorQuickPrompt {
  label: string;
  message: string;
}

const DEFAULT_PROMPTS: TutorQuickPrompt[] = [
  { label: '7-day study plan', message: 'Give me a 7-day study plan from these lectures' },
  { label: 'Where to start?', message: 'Which lecture should I start with as a beginner?' },
  { label: 'Hands-on labs', message: 'Explain the hands-on labs in more detail' },
  { label: 'Common mistakes', message: 'What are common mistakes students make?' },
];

export const TUTOR_QUICK_PROMPTS: Record<string, TutorQuickPrompt[]> = {
  python: [
    { label: '7-day study plan', message: 'Give me a 7-day Python study plan from these lectures' },
    { label: 'Where to start?', message: 'Which lecture should I start with as a complete beginner?' },
    { label: 'Variables tutorial', message: 'Teach me variables and data types step by step' },
    { label: 'Practice exercise', message: 'Give me a small practice exercise for today' },
    { label: 'Common mistakes', message: 'What are common Python mistakes beginners make?' },
  ],
  javascript: [
    { label: '7-day study plan', message: 'Give me a 7-day JavaScript study plan from these lectures' },
    { label: 'Where to start?', message: 'Which lecture should I start with as a beginner?' },
    { label: 'Functions & scope', message: 'Explain functions and scope with examples' },
    { label: 'Async / await', message: 'Walk me through async/await step by step' },
    { label: 'Common pitfalls', message: 'What are common JavaScript pitfalls?' },
  ],
  java: [
    { label: '7-day study plan', message: 'Give me a 7-day Java study plan from these lectures' },
    { label: 'Where to start?', message: 'Which lecture should I start with as a beginner?' },
    { label: 'OOP tutorial', message: 'Explain OOP in Java with a simple class example' },
    { label: 'Collections', message: 'How do collections work? Give me a tutorial' },
    { label: 'Common mistakes', message: 'What are common mistakes new Java learners make?' },
  ],
  prompt_engineering: [
    { label: 'Prompt tutorial', message: 'Give me a step-by-step prompt writing tutorial' },
    { label: 'Before / after', message: 'Show me a before/after prompt improvement example' },
    { label: 'System prompts', message: 'What makes a strong system prompt?' },
    { label: 'Iterate prompts', message: 'How do I iterate and evaluate my prompts?' },
    { label: 'Prompt template', message: 'Give me a reusable prompt template for learning' },
  ],
  ai_fundamentals: [
    { label: '7-day study plan', message: 'Give me a 7-day AI fundamentals study plan' },
    { label: 'ML vs deep learning', message: 'Explain machine learning vs deep learning simply' },
    { label: 'How LLMs work', message: 'How do large language models work step by step?' },
    { label: 'What to study first', message: 'What should I study first from this roadmap?' },
    { label: 'Responsible AI', message: 'What is responsible AI and why does it matter?' },
  ],
};

export const getQuickPrompts = (subjectId: string): TutorQuickPrompt[] =>
  TUTOR_QUICK_PROMPTS[subjectId] ?? DEFAULT_PROMPTS;

export const buildWelcomeMessage = (syllabusLabel: string, overview: string): string =>
  `Great choice! I built a 6-lecture roadmap for ${syllabusLabel}.\n\n${overview}\n\n` +
  'Ask me for step-by-step tutorials, practice exercises, study plans, or which lecture to tackle next.';
