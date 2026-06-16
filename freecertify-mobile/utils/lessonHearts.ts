import { getRandomQuestions, APIQuestion } from '../utils/api';

export function subjectIdFromUnit(unitId: string): string {
  if (unitId.startsWith('python_')) return 'python';
  if (unitId.startsWith('aws_')) return 'aws';
  return 'python';
}

export function extractHint(explanation: string): string | null {
  const match = explanation.match(/^Hint:\s*([\s\S]+?)(?:\n\n|$)/);
  return match ? match[1].trim() : null;
}

export function isDirectQuestion(explanation: string): boolean {
  return explanation.startsWith('Hint:');
}

/** Pick a hard direct-style question from the exam pool for the bonus heart challenge. */
export async function fetchBonusQuestion(examId: number): Promise<APIQuestion | null> {
  const pool = await getRandomQuestions(examId, 50);
  const hardDirect = pool.filter(
    q => q.difficulty === 'hard' && isDirectQuestion(q.explanation ?? ''),
  );
  const candidates = hardDirect.length
    ? hardDirect
    : pool.filter(q => q.difficulty === 'hard');
  if (!candidates.length) return pool[0] ?? null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
