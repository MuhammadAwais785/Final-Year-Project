// Temporary stand-in for the M04 recogniser (FR-11, FR-12). Same contract, no audio is
// ever recorded, stored or logged (BR-20). Remove once the m04 mock is in.
const OUTCOMES = ['recognized', 'incorrect', 'inconclusive', 'no_response'];
const DEFAULT_LISTEN_MS = 1500; // short so dev and tests never wait the real 6000ms

function buildResult(outcome, acceptedAnswers) {
  const other = acceptedAnswers[0] === 'x' ? 'y' : 'x';
  switch (outcome) {
    case 'recognized':
      return { heard: acceptedAnswers[0] ?? null, confidence: 0.9, score: 90, status: outcome };
    case 'incorrect':
      return { heard: other, confidence: 0.8, score: 30, status: outcome };
    case 'inconclusive':
      return { heard: other, confidence: 0.3, score: 20, status: outcome };
    default:
      return { heard: null, confidence: 0, score: 0, status: 'no_response' };
  }
}

/**
 * script: outcomes used in order; 'recognized' once exhausted.
 * cancel() resolves the pending call with status 'no_response' (same as the M04 contract).
 */
export function createMockRecognizer({ script = [], defaultListenMs = DEFAULT_LISTEN_MS } = {}) {
  let calls = 0;
  let pending = null; // { timer, resolve, acceptedAnswers }

  function settle(outcome) {
    if (!pending) return;
    const { timer, resolve, acceptedAnswers } = pending;
    pending = null;
    clearTimeout(timer);
    resolve(buildResult(outcome, acceptedAnswers));
  }

  function cancel() {
    settle('no_response');
  }

  function recognize({ acceptedAnswers = [], listenMs } = {}) {
    cancel(); // one listen at a time: an earlier pending call resolves as no_response (same as cancel)
    const outcome = calls < script.length ? script[calls] : 'recognized';
    calls += 1;
    const safe = OUTCOMES.includes(outcome) ? outcome : 'recognized';
    const wait = Math.min(listenMs || defaultListenMs, defaultListenMs);
    return new Promise((resolve) => {
      const timer = setTimeout(() => settle(safe), wait);
      pending = { timer, resolve, acceptedAnswers };
    });
  }

  return { recognize, cancel };
}
