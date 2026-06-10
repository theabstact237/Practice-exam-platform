/**
 * Python Adventure — 14-chapter gamified curriculum.
 * Domain codes in questions: CH01–CH14 (matches backend/python_100_questions.json).
 */
export interface SyllabusUnit {
  id: string;
  code: string;
  title: string;
  chapter: number;
  xp: number;
  prerequisites: string[];
}

export const PYTHON_CHAPTERS = [
  { id: 1, title: 'Getting Started', emoji: '🎮' },
  { id: 2, title: 'Core Skills', emoji: '🧱' },
  { id: 3, title: 'Control & Loops', emoji: '🔁' },
  { id: 4, title: 'Data & Logic', emoji: '📦' },
  { id: 5, title: 'Pro Level', emoji: '🏆' },
] as const;

export const PYTHON_UNITS: SyllabusUnit[] = [
  { id: 'python_unit_1', code: 'CH01', title: 'Python Adventure Start', chapter: 1, xp: 10, prerequisites: [] },
  { id: 'python_unit_2', code: 'CH02', title: 'Variables', chapter: 1, xp: 10, prerequisites: ['python_unit_1'] },
  { id: 'python_unit_3', code: 'CH03', title: 'Data Types', chapter: 1, xp: 10, prerequisites: ['python_unit_2'] },
  { id: 'python_unit_4', code: 'CH04', title: 'Print / Input', chapter: 1, xp: 12, prerequisites: ['python_unit_3'] },
  { id: 'python_unit_5', code: 'CH05', title: 'Conditional If/Else', chapter: 2, xp: 12, prerequisites: ['python_unit_4'] },
  { id: 'python_unit_6', code: 'CH06', title: 'While Loops', chapter: 2, xp: 12, prerequisites: ['python_unit_5'] },
  { id: 'python_unit_7', code: 'CH07', title: 'For Loops', chapter: 2, xp: 12, prerequisites: ['python_unit_6'] },
  { id: 'python_unit_8', code: 'CH08', title: 'Lists', chapter: 3, xp: 15, prerequisites: ['python_unit_7'] },
  { id: 'python_unit_9', code: 'CH09', title: 'Dictionaries', chapter: 3, xp: 15, prerequisites: ['python_unit_8'] },
  { id: 'python_unit_10', code: 'CH10', title: 'Tuples / Sets', chapter: 3, xp: 15, prerequisites: ['python_unit_9'] },
  { id: 'python_unit_11', code: 'CH11', title: 'Modular Functions', chapter: 3, xp: 18, prerequisites: ['python_unit_10'] },
  { id: 'python_unit_12', code: 'CH12', title: 'Classes / OOP', chapter: 4, xp: 20, prerequisites: ['python_unit_11'] },
  { id: 'python_unit_13', code: 'CH13', title: 'API Integration', chapter: 4, xp: 22, prerequisites: ['python_unit_12'] },
  { id: 'python_unit_14', code: 'CH14', title: 'Master Programmer', chapter: 4, xp: 25, prerequisites: ['python_unit_13'] },
];

export const getPythonUnitById = (unitId: string): SyllabusUnit | undefined =>
  PYTHON_UNITS.find(u => u.id === unitId);

/** Map mobile unit id → Django exam_type for question loading. */
export const unitIdToExamType = (unitId: string): string => {
  if (unitId.startsWith('python_')) return 'python';
  if (unitId.startsWith('aws_')) return 'cloud_practitioner';
  return 'cloud_practitioner';
};
