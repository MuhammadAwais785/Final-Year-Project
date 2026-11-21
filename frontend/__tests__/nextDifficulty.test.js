/**
 * M06 — Difficulty: nextDifficulty tests (Task 12, BR-14)
 */

const { nextDifficulty } = require('../src/modules/m06_difficulty/nextDifficulty');

describe('nextDifficulty', () => {
  test('returns easy with no history', () => {
    const { level, unlocked } = nextDifficulty('child1', 'objectNaming', []);
    expect(level).toBe('easy');
    expect(unlocked).toContain('easy');
  });

  test('promotes to medium after 3 correct in a row at easy', () => {
    const history = [
      { level: 'easy', correct: true },
      { level: 'easy', correct: true },
      { level: 'easy', correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', 'objectNaming', history);
    expect(level).toBe('medium');
    expect(unlocked).toContain('medium');
  });

  test('does not promote if streak broken', () => {
    const history = [
      { level: 'easy', correct: true },
      { level: 'easy', correct: false },
      { level: 'easy', correct: true },
      { level: 'easy', correct: true },
    ];
    const { level } = nextDifficulty('child1', 'objectNaming', history);
    expect(level).toBe('easy');
  });

  test('does not promote beyond hard', () => {
    const history = [
      { level: 'hard', correct: true },
      { level: 'hard', correct: true },
      { level: 'hard', correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', 'objectNaming', history);
    expect(level).toBe('hard');
    expect(unlocked).not.toContain(undefined);
  });

  test('unlocked grows as child progresses', () => {
    const history = [
      { level: 'easy',   correct: true },
      { level: 'easy',   correct: true },
      { level: 'easy',   correct: true },
      { level: 'medium', correct: true },
      { level: 'medium', correct: true },
      { level: 'medium', correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', 'objectNaming', history);
    expect(level).toBe('hard');
    expect(unlocked).toEqual(expect.arrayContaining(['easy', 'medium', 'hard']));
  });
});
