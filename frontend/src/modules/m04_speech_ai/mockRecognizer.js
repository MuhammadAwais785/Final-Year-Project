/**
 * M04 — Speech AI: Mock recogniser (replaces m03_games/mockRecognizer)
 *
 * Implements the full M04 contract (README.md).
 * No audio is ever recorded, stored or logged (BR-20, SEC-1).
 *
 * Usage in tests / dev gallery:
 *   import { speechRecognizer } from '../m04_speech_ai';
 *   speechRecognizer.simulate('correct');   // next recognize() → recognized
 *   speechRecognizer.simulate('wrong');     // → incorrect
 *   speechRecognizer.simulate('unclear');   // → inconclusive
 *   speechRecognizer.simulate('silence');   // → no_response
 *
 * Without a simulate() call it returns no_response after listenMs
 * (capped at 1 500 ms in dev/test so nothing waits the full 6 s).
 *
 * Status rules (apply in this order — README §Status rule):
 *   no_response  — nothing heard within listenMs
 *   inconclusive — confidence < CONFIDENCE_MIN
 *   recognized   — heard matches an accepted answer AND score >= SCORE_PASS
 *   incorrect    — anything else
 */

import { SPEECH } from '../../utils/constants';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a word for comparison:
 *   • lowercase + trim + strip punctuation
 *   • Arabic/Urdu diacritics removed
 *   • Urdu letter unification: ي→ی, ك→ک, ه→ہ
 */
function normalise(word) {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')          // Arabic/Urdu diacritics
    .replace(/\u064A/g, '\u06CC')             // ي → ی
    .replace(/\u0643/g, '\u06A9')             // ك → ک
    .replace(/\u0647/g, '\u06C1')             // ه → ہ
    .replace(/[^\w\u0600-\u06FF\s]/g, '')     // strip other punctuation
    .trim();
}

/** True if `heard` matches any of the accepted answers (normalised). */
function matchesAny(heard, acceptedAnswers) {
  const h = normalise(heard);
  return acceptedAnswers.some((a) => normalise(a) === h);
}

// ─── Mock outcomes ───────────────────────────────────────────────────────────

const SIMULATE_MAP = {
  correct:  'recognized',
  wrong:    'incorrect',
  unclear:  'inconclusive',
  silence:  'no_response',
};

/** Build the full result object for a given status. */
function buildResult(status, acceptedAnswers) {
  switch (status) {
    case 'recognized':
      return {
        heard:      acceptedAnswers[0] ?? null,
        confidence: 0.92,
        score:      90,
        status:     'recognized',
      };
    case 'incorrect':
      return {
        heard:      'unknown',
        confidence: 0.80,
        score:      25,
        status:     'incorrect',
      };
    case 'inconclusive':
      return {
        heard:      'maybe',
        confidence: 0.30,
        score:      15,
        status:     'inconclusive',
      };
    default:
      return { heard: null, confidence: 0, score: 0, status: 'no_response' };
  }
}

// ─── Mock recogniser factory ─────────────────────────────────────────────────

function createMock() {
  let pending = null;      // { timer, resolve }
  let nextOutcome = null;  // set by simulate()

  /** Resolve and clear any pending call. */
  function settle(status, acceptedAnswers) {
    if (!pending) return;
    const { timer, resolve, answers } = pending;
    pending = null;
    clearTimeout(timer);
    resolve(buildResult(status, answers ?? acceptedAnswers ?? []));
  }

  /**
   * Stop listening immediately.
   * The pending promise resolves with { status: 'no_response' }.
   */
  function cancel() {
    settle('no_response');
  }

  /**
   * Pre-load the outcome for the NEXT recognize() call.
   * @param {'correct'|'wrong'|'unclear'|'silence'} key
   */
  function simulate(key) {
    nextOutcome = SIMULATE_MAP[key] ?? 'no_response';
  }

  /**
   * @param {object} opts
   * @param {string[]} opts.acceptedAnswers - words the child should say
   * @param {'en'|'ur'}  opts.language
   * @param {number}     opts.listenMs      - how long to wait (games use ~6000)
   * @returns {Promise<{ heard, confidence, score, status }>}
   */
  function recognize({ acceptedAnswers = [], listenMs = SPEECH.LISTEN_MS } = {}) {
    // One listen at a time — an earlier pending call resolves as no_response
    cancel();

    const outcome = nextOutcome ?? 'no_response';
    nextOutcome = null;

    // In dev/test cap the wait so nothing hangs for 6 s
    const wait = __DEV__ ? Math.min(listenMs, 1500) : listenMs; // eslint-disable-line no-undef

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending = null;
        resolve(buildResult(outcome, acceptedAnswers));
      }, wait);
      pending = { timer, resolve, answers: acceptedAnswers };
    });
  }

  return { recognize, cancel, simulate };
}

// Singleton — all games share the same mock instance.
export const speechRecognizer = createMock();
