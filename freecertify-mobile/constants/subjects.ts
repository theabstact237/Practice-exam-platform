/**
 * Subject definitions — displayed in skill tree, onboarding, and navigation.
 */
import { Colors } from './theme';

export interface Subject {
  id: string;
  name: string;
  emoji: string;
  color: string;
  colorDark: string;
  tagline: string;
  description: string;
  mascotLabel: string;
}

export const SUBJECTS: Subject[] = [
  {
    id: 'python',
    name: 'Python',
    emoji: '🐍',
    color: Colors.python,
    colorDark: '#15803d',
    tagline: 'The most beginner-friendly language',
    description: 'Learn Python from variables to APIs — the world\'s most popular programming language.',
    mascotLabel: 'Pythia the Snake',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    emoji: '⚡',
    color: Colors.javascript,
    colorDark: '#a16207',
    tagline: 'The language of the web',
    description: 'Master JavaScript to build interactive websites, web apps, and backend services.',
    mascotLabel: 'Sparky the Bolt',
  },
  {
    id: 'java',
    name: 'Java',
    emoji: '☕',
    color: Colors.java,
    colorDark: '#c2410c',
    tagline: 'Write once, run anywhere',
    description: 'Learn Java — the backbone of enterprise software and Android development.',
    mascotLabel: 'Duke the Coffee Bot',
  },
  {
    id: 'aws',
    name: 'AWS & Cloud',
    emoji: '☁️',
    color: Colors.aws,
    colorDark: '#0369a1',
    tagline: 'The cloud that powers the internet',
    description: 'Master AWS services and prepare for Cloud Practitioner or Solutions Architect certification.',
    mascotLabel: 'Nimbus the Cloud Wizard',
  },
  {
    id: 'prompt_engineering',
    name: 'Prompt Engineering',
    emoji: '✍️',
    color: Colors.promptEng,
    colorDark: '#7e22ce',
    tagline: 'Talk to AI like a pro',
    description: 'Learn to write effective prompts for ChatGPT, Claude, and other AI tools.',
    mascotLabel: 'Quill the AI Pen',
  },
  {
    id: 'ai_fundamentals',
    name: 'AI Fundamentals',
    emoji: '🧠',
    color: Colors.aiFundamentals,
    colorDark: '#4338ca',
    tagline: 'Understand the AI revolution',
    description: 'Demystify machine learning, neural networks, LLMs, and responsible AI.',
    mascotLabel: 'Nova the Neural Brain',
  },
];

export const getSubjectById = (id: string): Subject | undefined =>
  SUBJECTS.find(s => s.id === id);
