import { addableGoals, suggestGoals, validateGoals, weakestSkill } from '../src/modules/m01_onboarding/goals';
import { GOALS } from '../src/utils/constants';

const baseline = (results) => ({
  responses: Object.entries(results).map(([taskId, result]) => ({ taskId, result, attempts: 1 })),
});
const ALL = ['apple', 'ball', 'cat', 'dog', 'fish', 'car', 'book', 'milk', 'sun', 'house'];
const saidFirst = (n) => baseline(Object.fromEntries(ALL.map((id, i) => [id, i < n ? 'said' : 'inconclusive'])));
const find = (goals, type) => goals.find((g) => g.type === type);

describe('suggestGoals', () => {
  test('gives a smaller weekly words target when fewer words were said', () => {
    const t = (n) => find(suggestGoals(saidFirst(n), 5), 'weekly_words').target;
    expect(t(1)).toBeLessThan(t(4));
    expect(t(4)).toBeLessThan(t(7));
    expect(t(7)).toBeLessThan(t(10));
  });

  test('gives 3 valid goals of the three types', () => {
    const goals = suggestGoals(saidFirst(6), 5);
    expect(goals.map((g) => g.type)).toEqual(['weekly_words', 'daily_minutes', 'skill']);
    expect(validateGoals(goals).valid).toBe(true);
  });

  test('picks the skill from the weakest area', () => {
    const b = baseline({ apple: 'said', milk: 'said', cat: 'inconclusive', dog: 'said', fish: 'said', ball: 'said', car: 'said' });
    expect(weakestSkill(b)).toBe('naming_animals');
    expect(find(suggestGoals(b, 5), 'skill').skill).toBe('naming_animals');
    expect(weakestSkill(baseline({ apple: 'inconclusive', milk: 'said', cat: 'said', ball: 'said' }))).toBe('naming_food');
  });

  test('ignores skipped pictures and falls back when nothing was asked', () => {
    expect(weakestSkill(baseline({ cat: 'skipped', apple: 'inconclusive' }))).toBe('naming_food');
    expect(weakestSkill(baseline({ cat: 'skipped' }))).toBe('naming_objects');
    expect(weakestSkill(null)).toBe('naming_objects');
  });

  test('works without a baseline and scales minutes with age', () => {
    expect(validateGoals(suggestGoals(null, undefined)).valid).toBe(true);
    const m = (age) => find(suggestGoals(null, age), 'daily_minutes').target;
    expect(m(3)).toBeLessThan(m(5));
    expect(m(5)).toBeLessThan(m(7));
  });
});

describe('suggestGoals edge cases', () => {
  test('ages outside 3-7 stay within the minutes range', () => {
    const m = (age) => find(suggestGoals(null, age), 'daily_minutes').target;
    [0, 2, 8, 12, -1, 4.5, NaN].forEach((age) => {
      expect(m(age)).toBeGreaterThanOrEqual(GOALS.MINUTES_MIN);
      expect(m(age)).toBeLessThanOrEqual(GOALS.MINUTES_MAX);
    });
  });

  test('an all-skipped or empty baseline still gives 3 valid goals', () => {
    const skipped = baseline(Object.fromEntries(ALL.map((id) => [id, 'skipped'])));
    expect(validateGoals(suggestGoals(skipped, 5)).valid).toBe(true);
    expect(find(suggestGoals(skipped, 5), 'skill').skill).toBe('naming_objects');
    expect(validateGoals(suggestGoals({ responses: [] }, 5)).valid).toBe(true);
    expect(validateGoals(suggestGoals({}, 5)).valid).toBe(true);
  });
});

describe('validateGoals', () => {
  const words = (target) => ({ id: 'w', type: 'weekly_words', target });
  const mins = (target) => ({ id: 'm', type: 'daily_minutes', target });
  const skill = (s, id = s) => ({ id, type: 'skill', skill: s });

  test('accepts an empty list and in-range goals', () => {
    expect(validateGoals([]).valid).toBe(true);
    expect(validateGoals([words(GOALS.WORDS_MIN), mins(GOALS.MINUTES_MAX), skill('colours')]).valid).toBe(true);
  });

  test('rejects more than 5 goals (BR-7)', () => {
    const six = ['naming_objects', 'naming_animals', 'naming_food', 'colours'].map((s) => skill(s)).concat([words(10), mins(10)]);
    expect(validateGoals(six.slice(0, 5)).valid).toBe(true);
    expect(validateGoals(six).errors).toContainEqual({ index: null, code: 'too_many' });
  });

  test('rejects out-of-range or non-integer targets', () => {
    expect(validateGoals([words(0)]).errors).toEqual([{ index: 0, code: 'words_range' }]);
    expect(validateGoals([words(GOALS.WORDS_MAX + 1)]).valid).toBe(false);
    expect(validateGoals([words(null)]).valid).toBe(false);
    expect(validateGoals([words(2.5)]).valid).toBe(false);
    expect(validateGoals([mins(GOALS.MINUTES_MIN - 1)]).errors).toEqual([{ index: 0, code: 'minutes_range' }]);
  });

  test('rejects duplicate weekly words, daily minutes or skill', () => {
    expect(validateGoals([words(10), { ...words(12), id: 'w2' }]).errors).toEqual([{ index: 1, code: 'duplicate' }]);
    expect(validateGoals([mins(10), { ...mins(10), id: 'm2' }]).valid).toBe(false);
    expect(validateGoals([skill('colours'), skill('colours', 'x')]).errors).toEqual([{ index: 1, code: 'duplicate' }]);
    expect(validateGoals([skill('colours'), skill('naming_food')]).valid).toBe(true);
  });

  test('rejects unknown skills and types, and non-lists', () => {
    expect(validateGoals([skill('juggling')]).errors).toEqual([{ index: 0, code: 'bad_skill' }]);
    expect(validateGoals([{ id: 'x', type: 'stars' }]).errors).toEqual([{ index: 0, code: 'bad_type' }]);
    expect(validateGoals(null).valid).toBe(false);
  });
});

describe('addableGoals', () => {
  test('offers only what is missing and nothing at the maximum', () => {
    const base = suggestGoals(null, 5);
    expect(addableGoals(base).map((g) => g.type)).toEqual(['skill']);
    expect(addableGoals([]).map((g) => g.type)).toEqual(['weekly_words', 'daily_minutes', 'skill']);
    const full = [...base, { id: 'a', type: 'skill', skill: 'colours' }, { id: 'b', type: 'skill', skill: 'naming_food' }];
    expect(addableGoals(full)).toEqual([]);
  });
});
