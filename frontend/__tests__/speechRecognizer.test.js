/**
 * M04 — Speech AI: Mock recogniser tests
 *
 * Covers the status rules from README.md §Status rule (TD-07 to TD-11).
 *
 * TD-07: no_response  — nothing said within listenMs
 * TD-08: inconclusive — confidence below minimum (simulate 'unclear')
 * TD-09: recognized   — heard matches accepted answer AND score >= threshold
 * TD-10: incorrect    — clear speech but wrong word or score below threshold
 * TD-11: cancel()     — pending recognize() resolves with no_response
 */

// Mock __DEV__ global (React Native sets this; Jest does not)
global.__DEV__ = true;

// Mock permissions util — mic is always granted in tests (no native modules in Jest)
jest.mock('../src/utils/permissions', () => ({
  requestMicrophone: jest.fn().mockResolvedValue('granted'),
}));

// Mock constants — provide SPEECH values without React Native
jest.mock('../src/utils/constants', () => ({
  SPEECH: { LISTEN_MS: 6000, CONFIDENCE_MIN: 0.6, SCORE_PASS: 60 },
}));

// We re-import inside each test so the mock resets cleanly
let mod;
beforeEach(() => {
  jest.resetModules();
  mod = require('../src/modules/m04_speech_ai/mockRecognizer');
});

describe('speechRecognizer — status rules', () => {
  test('TD-07: returns no_response when nothing is simulated (timeout)', async () => {
    const { speechRecognizer } = mod;
    const result = await speechRecognizer.recognize({
      acceptedAnswers: ['cat'],
      language: 'en',
      listenMs: 100,
    });
    expect(result.status).toBe('no_response');
    expect(result.heard).toBeNull();
    expect(result.score).toBe(0);
  });

  test('TD-08: returns inconclusive when simulated unclear', async () => {
    const { speechRecognizer } = mod;
    speechRecognizer.simulate('unclear');
    const result = await speechRecognizer.recognize({
      acceptedAnswers: ['cat'],
      language: 'en',
      listenMs: 100,
    });
    expect(result.status).toBe('inconclusive');
    expect(result.confidence).toBeLessThan(0.6);
  });

  test('TD-09: returns recognized when simulated correct', async () => {
    const { speechRecognizer } = mod;
    speechRecognizer.simulate('correct');
    const result = await speechRecognizer.recognize({
      acceptedAnswers: ['apple', 'سیب'],
      language: 'en',
      listenMs: 100,
    });
    expect(result.status).toBe('recognized');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.heard).toBe('apple');
  });

  test('TD-10: returns incorrect when simulated wrong', async () => {
    const { speechRecognizer } = mod;
    speechRecognizer.simulate('wrong');
    const result = await speechRecognizer.recognize({
      acceptedAnswers: ['ball'],
      language: 'en',
      listenMs: 100,
    });
    expect(result.status).toBe('incorrect');
    expect(result.confidence).toBeGreaterThanOrEqual(0.6);
  });

  test('TD-11: cancel() resolves pending recognize() as no_response', async () => {
    const { speechRecognizer } = mod;
    speechRecognizer.simulate('correct'); // would be recognized, but we cancel
    const promise = speechRecognizer.recognize({
      acceptedAnswers: ['dog'],
      language: 'en',
      listenMs: 5000, // long wait
    });
    speechRecognizer.cancel();
    const result = await promise;
    expect(result.status).toBe('no_response');
  });

  test('simulate is single-use — next call without simulate returns no_response', async () => {
    const { speechRecognizer } = mod;
    speechRecognizer.simulate('correct');
    // consume the simulated outcome
    await speechRecognizer.recognize({ acceptedAnswers: ['a'], listenMs: 100 });
    // next call with no simulate
    const result = await speechRecognizer.recognize({ acceptedAnswers: ['a'], listenMs: 100 });
    expect(result.status).toBe('no_response');
  });
});
