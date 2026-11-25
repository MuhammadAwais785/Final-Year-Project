/**
 * M06 — Difficulty: nextDifficulty tests (Task 12, BR-14)
 */

const { nextDifficulty } = require('../src/modules/m06_difficulty/nextDifficulty');
const { ACTIVITIES, LEVELS } = require('../src/utils/constants');

const [L1, L2, L3] = LEVELS;
const ACTIVITY = ACTIVITIES.OBJECT_NAMING;

describe('nextDifficulty', () => {
  test('returns the first level with no history', () => {
    const { level, unlocked } = nextDifficulty('child1', ACTIVITY, []);
    expect(level).toBe(L1);
    expect(unlocked).toContain(L1);
  });

  test('promotes to level 2 after 3 correct in a row at level 1', () => {
    const history = [
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L1, correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', ACTIVITY, history);
    expect(level).toBe(L2);
    expect(unlocked).toContain(L2);
  });

  test('does not promote if streak broken', () => {
    const history = [
      { level: L1, correct: true },
      { level: L1, correct: false },
      { level: L1, correct: true },
      { level: L1, correct: true },
    ];
    const { level } = nextDifficulty('child1', ACTIVITY, history);
    expect(level).toBe(L1);
  });

  test('does not promote beyond the last level', () => {
    const history = [
      { level: L3, correct: true },
      { level: L3, correct: true },
      { level: L3, correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', ACTIVITY, history);
    expect(level).toBe(L3);
    expect(unlocked).not.toContain(undefined);
  });

  test('unlocked grows as child progresses', () => {
    const history = [
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L2, correct: true },
      { level: L2, correct: true },
      { level: L2, correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', ACTIVITY, history);
    expect(level).toBe(L3);
    expect(unlocked).toEqual(expect.arrayContaining([L1, L2, L3]));
  });

  test('levels are numbers', () => {
    const { level } = nextDifficulty('child1', ACTIVITIES.COLOUR_MATCHING, []);
    expect(typeof level).toBe('number');
  });
  test('never locks a level again after playing an easier one', () => {
    const history = [
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L2, correct: false },
      { level: L1, correct: true },
    ];
    const { level, unlocked } = nextDifficulty('child1', ACTIVITY, history);
    expect(level).toBe(L1);
    expect(unlocked).toEqual([L1, L2]);
  });

  test('a streak at a lower level does not count towards the current level', () => {
    const history = [
      { level: L1, correct: true },
      { level: L1, correct: true },
      { level: L2, correct: true },
    ];
    expect(nextDifficulty('child1', ACTIVITY, history).level).toBe(L2);
  });
});
