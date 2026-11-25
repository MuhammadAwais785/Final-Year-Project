/**
 * M07 — Trigger: shouldStartBreak tests (BR-27)
 */

const { shouldStartBreak } = require('../src/modules/m07_intervention/shouldStartBreak');
const { ACTIVITIES, BREAK } = require('../src/utils/constants');

/** Samples spread evenly over the whole window, ending at "now". */
function makeIndicators(values, windowMs = BREAK.WINDOW_MS) {
  const now = Date.now();
  const step = values.length > 1 ? windowMs / (values.length - 1) : 0;
  return values.map((stress, i) => ({
    stress,
    frustration: stress * 0.8,
    boredom: 0.1,
    confidence: 1 - stress,
    at: now - windowMs + i * step,
  }));
}

describe('shouldStartBreak', () => {
  test('returns false with no indicators', () => {
    const { startBreak } = shouldStartBreak([], ACTIVITIES.OBJECT_NAMING);
    expect(startBreak).toBe(false);
  });

  test('returns false when stress is below threshold', () => {
    const indicators = makeIndicators([0.3, 0.4, 0.3, 0.2]);
    const { startBreak } = shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING);
    expect(startBreak).toBe(false);
  });

  test('returns false on a single spike (not sustained)', () => {
    const indicators = makeIndicators([0.3, 0.9, 0.2, 0.3]);
    const { startBreak } = shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING);
    expect(startBreak).toBe(false);
  });

  test('returns false for a short burst of high stress', () => {
    const indicators = [
      { stress: 0.9, at: 0 },
      { stress: 0.9, at: 100 },
      { stress: 0.9, at: 200 },
    ];
    const { startBreak, stressedActivity } = shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING);
    expect(startBreak).toBe(false);
    expect(stressedActivity).toBeNull();
  });

  test('returns true when high stress is sustained across the window', () => {
    const indicators = makeIndicators([0.7, 0.8, 0.75, 0.9]);
    const { startBreak, stressedActivity } = shouldStartBreak(indicators, ACTIVITIES.COLOUR_MATCHING);
    expect(startBreak).toBe(true);
    expect(stressedActivity).toBe(ACTIVITIES.COLOUR_MATCHING);
  });

  test('returns true for high stress over at least 8 seconds with enough samples', () => {
    const indicators = [0, 2000, 4000, 6000, 8000].map((at) => ({ stress: 0.85, at }));
    const { startBreak } = shouldStartBreak(indicators, ACTIVITIES.SOUND_IMITATION);
    expect(startBreak).toBe(true);
  });

  test('stressedActivity is recorded correctly', () => {
    const indicators = makeIndicators([0.8, 0.8, 0.8, 0.8]);
    const { stressedActivity } = shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING);
    expect(stressedActivity).toBe(ACTIVITIES.OBJECT_NAMING);
  });
  test('returns false when high stress covers just under 80% of the window', () => {
    const indicators = [0, 2000, 4000, 7999].map((at) => ({ stress: 0.9, at }));
    expect(shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING).startBreak).toBe(false);
  });

  test('returns false when one sample in a long window dips below the threshold', () => {
    const indicators = makeIndicators([0.9, 0.9, 0.3, 0.9, 0.9]);
    expect(shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING).startBreak).toBe(false);
  });

  test('ignores old low-stress samples outside the window', () => {
    const indicators = [{ stress: 0.1, at: 0 }, ...[20000, 24000, 28000, 30000].map((at) => ({ stress: 0.9, at }))];
    expect(shouldStartBreak(indicators, ACTIVITIES.OBJECT_NAMING).startBreak).toBe(true);
  });
});

test('unsorted samples are sorted before checking the window', () => {
  const sorted = makeIndicators([0.9, 0.9, 0.9, 0.9]);
  const shuffled = [sorted[2], sorted[0], sorted[3], sorted[1]];
  expect(shouldStartBreak(shuffled, ACTIVITIES.OBJECT_NAMING)).toEqual(shouldStartBreak(sorted, ACTIVITIES.OBJECT_NAMING));
});
