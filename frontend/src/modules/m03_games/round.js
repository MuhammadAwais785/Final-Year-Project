// Pure game-round logic shared by all speech games (UC-5). No React, no storage.
import { GAME } from '../../utils/constants';

function shuffle(items, random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// BR-15: every id is used once before any repeats; a new cycle never starts with the id that just ended the last one.
export function pickPrompts(ids, count, random = Math.random) {
  const picked = [];
  while (picked.length < count && ids.length > 0) {
    const cycle = shuffle(ids, random);
    const last = picked[picked.length - 1];
    if (cycle.length > 1 && cycle[0] === last) {
      [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
    }
    picked.push(...cycle.slice(0, count - picked.length));
  }
  return picked;
}

export function createRound(promptIds) {
  return {
    promptIds: [...promptIds],
    index: 0,
    attempts: 0,
    consecutiveFails: 0,
    hintLevel: 0,
    results: [],
    attemptLog: [],
    finished: promptIds.length === 0,
  };
}

export function currentPromptId(state) {
  return state.finished ? null : state.promptIds[state.index];
}

function advance(state, result) {
  const index = state.index + 1;
  return {
    ...state,
    index,
    attempts: 0,
    consecutiveFails: 0,
    hintLevel: 0,
    results: [...state.results, result],
    finished: index >= state.promptIds.length,
  };
}

// status: 'recognized' | 'incorrect' | 'inconclusive' | 'no_response' (M04 contract).
// Every attempt, including inconclusive ones, counts toward the attempt cap so a round always ends.
export function applyResult(state, { status, score }, at, config = {}) {
  if (state.finished) {
    return { state, feedback: null };
  }
  const cfg = { ...GAME, ...config };
  const promptId = currentPromptId(state);
  const attempts = state.attempts + 1;
  const attemptLog = [...state.attemptLog, { promptId, status, score, hintLevel: state.hintLevel, at }];
  const base = { ...state, attempts, attemptLog };

  if (status === 'recognized') {
    const hinted = state.hintLevel > 0;
    const result = {
      promptId,
      outcome: hinted ? 'correct_with_hint' : 'correct',
      stars: hinted ? cfg.STARS_WITH_HINT : cfg.STARS_CORRECT,
      attempts,
    };
    return { state: advance(base, result), feedback: 'correct' };
  }

  let next = base;
  let feedback = 'unclear'; // BR-22: inconclusive is never a failure
  if (status === 'incorrect' || status === 'no_response') {
    const consecutiveFails = state.consecutiveFails + 1;
    const hintLevel =
      consecutiveFails >= cfg.HINT_AFTER_FAILS
        ? Math.min(consecutiveFails - cfg.HINT_AFTER_FAILS + 1, cfg.MAX_HINT_LEVEL)
        : 0;
    next = { ...base, consecutiveFails, hintLevel };
    feedback = hintLevel > 0 ? 'hint' : 'try_again';
  }

  if (attempts >= cfg.MAX_ATTEMPTS) {
    return {
      state: advance(next, { promptId, outcome: 'inconclusive', stars: 0, attempts }),
      feedback: 'moving_on',
    };
  }
  return { state: next, feedback };
}

export function summarize(state) {
  return {
    stars: state.results.reduce((sum, r) => sum + r.stars, 0),
    correct: state.results.filter((r) => r.outcome !== 'inconclusive').length,
    practiced: state.results.length,
    inconclusive: state.results.filter((r) => r.outcome === 'inconclusive').length,
  };
}
