import { createMockRecognizer } from '../src/modules/m03_games/mockRecognizer';
import { listenForPrompt, cancelListening } from '../src/modules/m03_games/playPrompt';
import { recognizer } from '../src/modules/m03_games/speech';
import { createRound, applyResult } from '../src/modules/m03_games/round';
import { objectItem } from '../src/modules/m03_games/objectNamingContent';

const cat = objectItem('cat');

async function listen(rec, language = 'en', ms = 6000) {
  const p = listenForPrompt(rec, cat, language, ms);
  await jest.advanceTimersByTimeAsync(1500);
  return p;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  expect(jest.getTimerCount()).toBe(0);
  jest.useRealTimers();
});

describe('statuses flow into round.applyResult', () => {
  const cases = [
    ['recognized', 'correct'],
    ['incorrect', 'try_again'],
    ['inconclusive', 'unclear'],
    ['no_response', 'try_again'],
  ];
  test.each(cases)('%s -> %s', async (status, feedback) => {
    const rec = createMockRecognizer({ script: [status] });
    const result = await listen(rec);
    expect(result.status).toBe(status);
    const out = applyResult(createRound(['cat']), result, 0);
    expect(out.feedback).toBe(feedback);
  });

  test('silent answers reach a hint after repeated misses; unclear never does', async () => {
    const rec = createMockRecognizer({ script: ['no_response', 'no_response'] });
    let state = createRound(['cat']);
    let fb;
    for (let i = 0; i < 2; i++) {
      ({ state, feedback: fb } = applyResult(state, await listen(rec), i));
    }
    expect(fb).toBe('hint');
    const unclear = createMockRecognizer({ script: ['inconclusive', 'inconclusive'] });
    let s2 = createRound(['cat']);
    for (let i = 0; i < 2; i++) {
      ({ state: s2, feedback: fb } = applyResult(s2, await listen(unclear), i));
    }
    expect(fb).toBe('unclear');
    expect(s2.consecutiveFails).toBe(0);
  });
});

describe('accepted answers', () => {
  test.each([['en'], ['ur']])('passes %s answers, language and listenMs', async (lang) => {
    const rec = { recognize: jest.fn().mockResolvedValue({ status: 'recognized', score: 90 }), cancel: jest.fn() };
    await listenForPrompt(rec, cat, lang, 6000);
    expect(rec.recognize).toHaveBeenCalledWith({
      acceptedAnswers: cat[lang].accepted,
      language: lang,
      listenMs: 6000,
    });
  });

  test('mock hears the first accepted answer when recognized', async () => {
    const rec = createMockRecognizer({ script: ['recognized', 'incorrect', 'inconclusive'] });
    const heard = [];
    for (let i = 0; i < 3; i++) {
      const p = rec.recognize({ acceptedAnswers: cat.ur.accepted, language: 'ur', listenMs: 6000 });
      await jest.advanceTimersByTimeAsync(1500);
      heard.push(await p);
    }
    expect(heard[0]).toMatchObject({ heard: 'بلی', status: 'recognized', score: 90 });
    expect(heard[0].confidence).toBeGreaterThan(0.6);
    expect(cat.ur.accepted).not.toContain(heard[1].heard);
    expect(heard[1]).toMatchObject({ status: 'incorrect', score: 30 });
    expect(heard[2].confidence).toBeLessThan(0.6);
    expect(heard[2].heard).not.toBeNull();
  });
});

describe('script and timing', () => {
  test('defaults to recognized once the script is exhausted', async () => {
    const rec = createMockRecognizer({ script: ['incorrect'] });
    expect((await listen(rec)).status).toBe('incorrect');
    expect((await listen(rec)).status).toBe('recognized');
    expect((await listen(rec)).status).toBe('recognized');
  });

  test('listenMs is capped by the injectable default', async () => {
    const rec = createMockRecognizer({ defaultListenMs: 100 });
    const p = rec.recognize({ acceptedAnswers: ['cat'], language: 'en', listenMs: 6000 });
    await jest.advanceTimersByTimeAsync(100);
    expect((await p).status).toBe('recognized');
  });
});

describe('cancel', () => {
  test('mock cancel resolves the pending call as no_response and clears the timer', async () => {
    const rec = createMockRecognizer({ script: ['recognized'] });
    const p = rec.recognize({ acceptedAnswers: ['cat'], language: 'en', listenMs: 6000 });
    rec.cancel();
    expect(jest.getTimerCount()).toBe(0);
    expect(await p).toMatchObject({ status: 'no_response', heard: null });
  });

  test('cancel with nothing pending is harmless', () => {
    expect(() => createMockRecognizer().cancel()).not.toThrow();
  });

  test('cancelListening drops the stale result', async () => {
    const rec = createMockRecognizer();
    const p = listenForPrompt(rec, cat, 'en', 6000);
    cancelListening(rec);
    expect(await p).toBeNull();
    expect(await listen(rec)).toMatchObject({ status: 'recognized' });
  });

  test('a second listen makes the first return null, not a miss', async () => {
    const rec = createMockRecognizer({ script: ['recognized', 'recognized'] });
    const first = listenForPrompt(rec, cat, 'en', 6000);
    const second = listenForPrompt(rec, cat, 'en', 6000);
    expect(await first).toBeNull();
    await jest.advanceTimersByTimeAsync(1500);
    expect(await second).toMatchObject({ status: 'recognized', score: 90 });
  });

  test('cancel then a new listen: only the new result counts', async () => {
    const rec = createMockRecognizer({ script: ['recognized', 'incorrect'] });
    const old = listenForPrompt(rec, cat, 'en', 6000);
    cancelListening(rec);
    const fresh = listenForPrompt(rec, cat, 'en', 6000);
    expect(await old).toBeNull();
    await jest.advanceTimersByTimeAsync(1500);
    expect((await fresh).status).toBe('incorrect');
  });
});

describe('getRecognizer', () => {
  test('exports a recogniser with the contract shape', () => {
    expect(typeof recognizer.recognize).toBe('function');
    expect(typeof recognizer.cancel).toBe('function');
  });
});
