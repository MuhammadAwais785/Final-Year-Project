/**
 * M04 — Speech AI tests
 *
 * Tests for ClarityScorer (pure logic, no native modules needed).
 */

import { scoreClarity } from '../src/modules/m04_speech_ai/ClarityScorer';
import { SPEECH } from '../src/utils/constants';

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

  test('one-letter slip on a long word still passes', () => {
    expect(scoreClarity('aple', 'apple').score).toBeGreaterThanOrEqual(SPEECH.SCORE_PASS);
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

  test('label perfect on exact', () => {
    expect(scoreClarity('ball', 'ball').label).toBe('perfect');
  });

  test('label good on a passing close match', () => {
    expect(scoreClarity('aple', 'apple').label).toBe('good');
  });
});

describe('scoreClarity strictness', () => {
  test('a single letter does not pass for a short word', () => {
    expect(scoreClarity('c', 'cat').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('a different short word does not pass', () => {
    expect(scoreClarity('bat', 'cat').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('a single letter does not pass for a long word', () => {
    expect(scoreClarity('a', 'banana').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('a short word needs an exact match', () => {
    expect(scoreClarity('bll', 'ball').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('a partial match one letter short of a long word passes', () => {
    expect(scoreClarity('appl', 'apple').score).toBeGreaterThanOrEqual(SPEECH.SCORE_PASS);
  });
});

describe('scoreClarity in Urdu', () => {
  test('exact word passes', () => {
    expect(scoreClarity('سیب', 'سیب').score).toBe(100);
  });

  test('a single letter does not pass', () => {
    expect(scoreClarity('س', 'سیب').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('a different short word does not pass', () => {
    expect(scoreClarity('سب', 'سیب').score).toBeLessThan(SPEECH.SCORE_PASS);
  });

  test('exact word inside a sentence → 100', () => {
    expect(scoreClarity('یہ سیب ہے', 'سیب').score).toBe(100);
  });
});

describe('wrong words never pass', () => {
  test.each([
    ['ca', 'cat'], ['at', 'cat'], ['all', 'ball'], ['catapult', 'cat'],
    ['applesauce', 'apple'], ['pineapple', 'apple'], ['سی', 'سیب'], ['بل', 'بلی'],
  ])('%s for %s fails', (heard, target) => {
    expect(scoreClarity(heard, target).score).toBeLessThan(60);
  });

  test('a plural of a short word still passes', () => {
    expect(scoreClarity('dogs', 'dog').score).toBe(85);
  });

  test('Arabic letter forms from the recogniser match Urdu words', () => {
    expect(scoreClarity('\u0628\u0644\u064A', 'بلی').score).toBe(100);
    expect(scoreClarity('\u0643\u062A\u0627', 'کتا').score).toBe(100);
  });
});

