/**
 * M04 — Speech AI tests
 *
 * Tests for ClarityScorer (pure logic, no native modules needed).
 */

import { CLARITY_FEEDBACK, scoreClarity } from '../src/modules/m04_speech_ai/ClarityScorer';

describe('scoreClarity', () => {
  test('exact match → 100', () => {
    expect(scoreClarity('apple', 'apple').score).toBe(100);
  });

  test('exact match after normalise (mixed case) → 100', () => {
    expect(scoreClarity('Apple', 'apple').score).toBe(100);
  });

  test('word inside transcript → 100', () => {
    expect(scoreClarity('I see apple', 'apple').score).toBe(100);
  });

  test('starts-with match → 85', () => {
    expect(scoreClarity('apples', 'apple').score).toBe(85);
  });

  test('close typo (edit dist ≤ 2) → 60', () => {
    const r = scoreClarity('aple', 'apple');
    expect(r.score).toBeGreaterThanOrEqual(60);
  });

  test('no match → 0', () => {
    expect(scoreClarity('xyz', 'apple').score).toBe(0);
  });

  test('empty transcript → no_match', () => {
    expect(scoreClarity('', 'apple').label).toBe('no_match');
  });

  test('empty expected → no_match', () => {
    expect(scoreClarity('apple', '').label).toBe('no_match');
  });

  test('Urdu word match', () => {
    expect(scoreClarity('سیب', 'سیب').score).toBe(100);
  });

  test('label perfect on exact', () => {
    expect(scoreClarity('ball', 'ball').label).toBe('perfect');
  });

  test('label good on close match', () => {
    const r = scoreClarity('bll', 'ball');
    expect(['good', 'try_again']).toContain(r.label);
  });
});

describe('CLARITY_FEEDBACK', () => {
  test('has en and ur for all labels', () => {
    ['perfect', 'good', 'try_again', 'no_match'].forEach((label) => {
      expect(CLARITY_FEEDBACK[label].en).toBeTruthy();
      expect(CLARITY_FEEDBACK[label].ur).toBeTruthy();
    });
  });
});
