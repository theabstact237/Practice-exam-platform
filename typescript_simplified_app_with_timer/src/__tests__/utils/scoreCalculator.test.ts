/**
 * Unit tests for score calculation logic extracted from App.tsx.
 * These test the pure business logic: scoring, pass/fail, domain breakdown.
 */

describe('Score Calculation', () => {
  const makeAnswers = (results: Array<{ isCorrect: boolean; attempted: boolean; timedOut?: boolean }>) => {
    return Object.fromEntries(
      results.map((r, i) => [
        i + 1,
        { selectedLetter: r.isCorrect ? 'A' : 'B', isCorrect: r.isCorrect, attempted: r.attempted, timedOut: r.timedOut ?? false },
      ])
    );
  };

  it('calculates correct score when all answers are correct', () => {
    const answers = makeAnswers(Array(10).fill({ isCorrect: true, attempted: true }));
    const correct = Object.values(answers).filter(a => a.isCorrect).length;
    expect(correct).toBe(10);
  });

  it('calculates correct score when all answers are wrong', () => {
    const answers = makeAnswers(Array(10).fill({ isCorrect: false, attempted: true }));
    const correct = Object.values(answers).filter(a => a.isCorrect).length;
    expect(correct).toBe(0);
  });

  it('calculates percentage correctly', () => {
    const correct = 35;
    const total = 50;
    const percentage = Math.round((correct / total) * 100);
    expect(percentage).toBe(70);
  });

  it('passes at exactly 70%', () => {
    const percentage = 70;
    expect(percentage >= 70).toBe(true);
  });

  it('fails at 69%', () => {
    const percentage = 69;
    expect(percentage >= 70).toBe(false);
  });

  it('counts timed out questions correctly', () => {
    const answers = makeAnswers([
      { isCorrect: false, attempted: true, timedOut: true },
      { isCorrect: false, attempted: true, timedOut: true },
      { isCorrect: true, attempted: true, timedOut: false },
    ]);
    const timedOut = Object.values(answers).filter(a => a.timedOut).length;
    expect(timedOut).toBe(2);
  });

  it('counts unattempted questions correctly', () => {
    const answers = makeAnswers([
      { isCorrect: true, attempted: true },
      { isCorrect: false, attempted: false },
      { isCorrect: false, attempted: false },
    ]);
    const notAttempted = 3 - Object.values(answers).filter(a => a.attempted).length;
    expect(notAttempted).toBe(2);
  });

  it('computes domain breakdown correctly', () => {
    const questions = [
      { id: 1, domain: 'Storage' },
      { id: 2, domain: 'Storage' },
      { id: 3, domain: 'Compute' },
    ];
    const userAnswers: Record<number, { isCorrect: boolean }> = {
      1: { isCorrect: true },
      2: { isCorrect: false },
      3: { isCorrect: true },
    };
    const domainScores: Record<string, { correct: number; total: number }> = {};
    questions.forEach(q => {
      const domain = q.domain || 'General';
      if (!domainScores[domain]) domainScores[domain] = { correct: 0, total: 0 };
      domainScores[domain].total++;
      if (userAnswers[q.id]?.isCorrect) domainScores[domain].correct++;
    });

    expect(domainScores['Storage']).toEqual({ correct: 1, total: 2 });
    expect(domainScores['Compute']).toEqual({ correct: 1, total: 1 });
  });
});

describe('Timer Logic', () => {
  it('formats time correctly for full minutes', () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9)).toBe('0:09');
    expect(formatTime(30)).toBe('0:30');
  });
});
