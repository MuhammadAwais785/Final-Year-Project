/**
 * M07 — Trigger: shouldStartBreak tests (BR-27)
 */

const { shouldStartBreak } = require('../src/modules/m07_intervention/shouldStartBreak');

function makeIndicators(values, windowMs = 10000) {
  // Space them evenly inside the window
  const now = Date.now();
  return values.map((stress, i) => ({
    stress,
    frustration: stress * 0.8,
    boredom: 0.1,
    confidence: 1 - stress,
    at: now - windowMs + (i * windowMs) / values.length,
  }));
}

describe('shouldStartBreak', () => {
  test('returns false with no indicators', () => {
    const { startBreak } = shouldStartBreak([], 'objectNaming');
    expect(startBreak).toBe(false);
  });

  test('returns false when stress is below threshold', () => {
    const indicators = makeIndicators([0.3, 0.4, 0.3, 0.2]);
    const { startBreak } = shouldStartBreak(indicators, 'objectNaming');
    expect(startBreak).toBe(false);
  });

  test('returns false on a single spike (not sustained)', () => {
    // One high, rest low
    const indicators = makeIndicators([0.3, 0.9, 0.2, 0.3]);
    const { startBreak } = shouldStartBreak(indicators, 'objectNaming');
    expect(startBreak).toBe(false);
  });

  test('returns true when all samples in window are above threshold', () => {
    const indicators = makeIndicators([0.7, 0.8, 0.75, 0.9]);
    const { startBreak, stressedActivity } = shouldStartBreak(indicators, 'colourMatching');
    expect(startBreak).toBe(true);
    expect(stressedActivity).toBe('colourMatching');
  });

  test('stressedActivity is recorded correctly', () => {
    const indicators = makeIndicators([0.8, 0.8, 0.8, 0.8]);
    const { stressedActivity } = shouldStartBreak(indicators, 'objectNaming');
    expect(stressedActivity).toBe('objectNaming');
  });
});
