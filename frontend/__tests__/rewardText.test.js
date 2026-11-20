import { MILESTONE_TEXT, PRAISE, pickPraise } from '../src/modules/m03_games/rewardText';

describe('pickPraise', () => {
  test.each(['en', 'ur'])('has several lines in %s and returns one of them', (lang) => {
    expect(PRAISE[lang].length).toBeGreaterThan(2);
    expect(PRAISE[lang]).toContain(pickPraise(lang));
    expect(MILESTONE_TEXT[lang]).toBeTruthy();
  });

  test('varies with the random value, including the edges', () => {
    const seen = new Set([0, 0.25, 0.5, 0.75, 0.9999].map((r) => pickPraise('en', () => r)));
    expect(seen.size).toBeGreaterThan(2);
    expect(pickPraise('ur', () => 0.9999)).toBe(PRAISE.ur[PRAISE.ur.length - 1]);
    expect(pickPraise('ur', () => 1)).toBe(PRAISE.ur[PRAISE.ur.length - 1]);
  });

  test('falls back to English for an unknown language', () => {
    expect(PRAISE.en).toContain(pickPraise('fr'));
  });
});
