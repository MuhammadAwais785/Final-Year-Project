import {
  canStartNewBaseline, createBaseline, currentTaskId, MAX_ATTEMPTS, progressPercent,
  recordSaid, recordSkip, recordTryAgain, scoreOf,
} from '../src/modules/m01_onboarding/baseline';
import { BASELINE_CHECKLIST } from '../src/modules/m01_onboarding/baselineChecklist';
import { loadInProgress, loadLastCompleted, saveBaseline } from '../src/modules/m01_onboarding/baselineStore';

jest.mock('@react-native-async-storage/async-storage', () => {
  let data = {};
  return {
    getItem: jest.fn(async (k) => (k in data ? data[k] : null)),
    setItem: jest.fn(async (k, v) => { data[k] = v; }),
    removeItem: jest.fn(async (k) => { delete data[k]; }),
    clear: async () => { data = {}; },
  };
});
const AsyncStorage = require('@react-native-async-storage/async-storage');

const CHECKLIST = { version: 'test', tasks: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }] };
const NOW = Date.parse('2026-11-16T10:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const start = () => createBaseline('child-1', CHECKLIST, NOW);

describe('baseline checklist', () => {
  test('has 10 tasks with unique ids and a word in both languages', () => {
    const { tasks, version } = BASELINE_CHECKLIST;
    expect(version).toBeTruthy();
    expect(tasks).toHaveLength(10);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(10);
    tasks.forEach((t) => {
      expect(t.word.en.trim()).not.toBe('');
      expect(t.word.ur.trim()).not.toBe('');
    });
  });
});

describe('baseline rules (FR-2, BR-5)', () => {
  test('starts incomplete on the first task, attempt 1, with the checklist version', () => {
    const b = start();
    expect(b).toMatchObject({ childId: 'child-1', checklistVersion: 'test', status: 'incomplete', attempts: 1, baselineScore: null });
    expect(currentTaskId(b)).toBe('a');
    expect(progressPercent(b)).toBe(0);
  });

  test('"Child said it" records the task and moves on', () => {
    const b = recordSaid(start(), NOW);
    expect(b.responses).toEqual([{ taskId: 'a', result: 'said', attempts: 1 }]);
    expect(currentTaskId(b)).toBe('b');
    expect(progressPercent(b)).toBe(25);
  });

  test('"Try again" counts attempts; a later success keeps the attempt count', () => {
    const b = recordSaid(recordTryAgain(start(), NOW), NOW);
    expect(b.responses[0]).toEqual({ taskId: 'a', result: 'said', attempts: 2 });
  });

  test(`after ${MAX_ATTEMPTS} attempts the task is inconclusive and the next one starts`, () => {
    let b = start();
    for (let i = 0; i < MAX_ATTEMPTS; i++) b = recordTryAgain(b, NOW);
    expect(b.responses).toEqual([{ taskId: 'a', result: 'inconclusive', attempts: MAX_ATTEMPTS }]);
    expect(currentTaskId(b)).toBe('b');
    expect(b.attempts).toBe(1);
  });

  test('"Skip" records a skipped task', () => {
    expect(recordSkip(start(), NOW).responses[0]).toEqual({ taskId: 'a', result: 'skipped', attempts: 1 });
  });

  test('completes after the last task with a score that ignores skipped tasks', () => {
    let b = start();
    b = recordSaid(b, NOW); // a said
    b = recordSkip(b, NOW); // b skipped
    for (let i = 0; i < MAX_ATTEMPTS; i++) b = recordTryAgain(b, NOW); // c inconclusive
    b = recordSaid(b, NOW + 5000); // d said
    expect(b.status).toBe('complete');
    expect(b.baselineScore).toBe(67); // 2 said of 3 attempted
    expect(b.completedAt).toBe(new Date(NOW + 5000).toISOString());
    expect(currentTaskId(b)).toBeNull();
    expect(recordSaid(b, NOW)).toBe(b); // nothing changes after completion
  });

  test('score is null when every task was skipped', () => {
    expect(scoreOf([{ result: 'skipped' }, { result: 'skipped' }])).toBeNull();
  });
});

describe('re-assessment rule (BR-6)', () => {
  test('allowed with no previous baseline, blocked within 30 days, allowed after', () => {
    const last = { completedAt: new Date(NOW).toISOString() };
    expect(canStartNewBaseline(null, NOW)).toBe(true);
    expect(canStartNewBaseline(last, NOW + 29 * DAY)).toBe(false);
    expect(canStartNewBaseline(last, NOW + 30 * DAY)).toBe(true);
  });
});

describe('baselineStore', () => {
  beforeEach(() => AsyncStorage.clear());

  test('keeps an unfinished baseline to resume later', async () => {
    const b = recordSaid(start(), NOW);
    await saveBaseline(b);
    expect(await loadInProgress('child-1')).toEqual(b);
    expect(await loadLastCompleted('child-1')).toBeNull();
  });

  test('a completed baseline becomes the last completed and clears the unfinished one', async () => {
    let b = start();
    await saveBaseline(b);
    ['a', 'b', 'c', 'd'].forEach(() => { b = recordSaid(b, NOW); });
    await saveBaseline(b);
    expect(await loadInProgress('child-1')).toBeNull();
    expect((await loadLastCompleted('child-1')).baselineScore).toBe(100);
  });
});
