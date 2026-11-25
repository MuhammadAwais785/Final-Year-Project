/**
 * M04 — Speech AI: Mock recogniser
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
 * Without a simulate() call it returns 'recognized' after listenMs
 * (capped at 1 500 ms in dev/test so nothing waits the full 6 s), so the
 * real app's games can be played.
 *
 * Status rules (apply in this order — README §Status rule):
 *   no_response  — nothing heard within listenMs OR mic permission not granted
 *   inconclusive — confidence < CONFIDENCE_MIN (BR-22)
 *   recognized   — heard matches an accepted answer AND score >= SCORE_PASS (BR-23)
 *   incorrect    — anything else
 *
 * Mic permission (README rule): requestMicrophone() is called before first listen.
 * If not granted → no_response immediately (never tries to record).
 */

import { GAME } from '../../utils/constants';
import { requestMicrophone } from '../../utils/permissions';

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
  let pending = null;      // { timer, resolve, answers }
  let nextOutcome = null;  // set by simulate()
  let micGranted = null;   // cached: null = not checked yet, true/false after first check

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
   *
   * Intentionally NOT async so cancel() can interrupt synchronously.
   * Mic permission is checked in the background after pending is set.
   */
  function recognize({ acceptedAnswers = [], listenMs = GAME.LISTEN_MS } = {}) {
    // One listen at a time — an earlier pending call resolves as no_response
    cancel();

    // Mic already known denied — resolve immediately
    if (micGranted === false) {
      return Promise.resolve(buildResult('no_response', []));
    }

    const outcome = nextOutcome ?? 'recognized';
    nextOutcome = null;

    // In dev/test cap the wait so nothing hangs for 6 s
    const wait = __DEV__ ? Math.min(listenMs, 1500) : listenMs;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending = null;
        resolve(buildResult(outcome, acceptedAnswers));
      }, wait);
      pending = { timer, resolve, answers: acceptedAnswers };

      // Mic permission check async (README rule, HI-1).
      // If denied, cancel the pending listen immediately.
      // micGranted=null means first call — check now; micGranted=true means already cached.
      if (micGranted === null) {
        requestMicrophone().then((result) => {
          micGranted = result === 'granted';
          if (!micGranted) settle('no_response');
        }).catch(() => {
          micGranted = false;
          settle('no_response');
        });
      }
    });
  }

  return { recognize, cancel, simulate };
}

// Singleton — all games share the same mock instance.
export const speechRecognizer = createMock();
