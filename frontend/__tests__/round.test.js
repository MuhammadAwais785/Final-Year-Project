import { pickPrompts, createRound, currentPromptId, applyResult, summarize } from '../src/modules/m03_games/round';
import { GAME } from '../src/utils/constants';

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const ok = { status: 'recognized', score: 90 };
const bad = { status: 'incorrect', score: 20 };
const silent = { status: 'no_response', score: 0 };
const unclear = { status: 'inconclusive', score: 40 };

// Applies a list of results; returns last { state, feedback } and all feedbacks.
function play(state, results) {
  const feedbacks = [];
  let out = { state, feedback: null };
  results.forEach((r, i) => {
    out = applyResult(out.state, r, 1000 + i);
    feedbacks.push(out.feedback);
  });
  return { ...out, feedbacks };
}

describe('GAME constants', () => {
  it('has the agreed numbers', () => {
    expect(GAME).toMatchObject({ ROUND_SIZE: 6, HINT_AFTER_FAILS: 2, MAX_HINT_LEVEL: 3, MAX_ATTEMPTS: 5, STARS_CORRECT: 2, STARS_WITH_HINT: 1 });
  });
});

describe('pickPrompts (BR-15)', () => {
  it('returns the requested count of unique ids when the set is big enough', () => {
    const p = pickPrompts(IDS, 6, seeded(1));
    expect(p).toHaveLength(6);
    expect(new Set(p).size).toBe(6);
    p.forEach((id) => expect(IDS).toContain(id));
  });
  it('uses every id when count equals the set size', () => {
    expect([...pickPrompts(IDS, 8, seeded(2))].sort()).toEqual(IDS);
  });
  it('does not repeat until every id is used, then reuses them', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const p = pickPrompts(IDS, 20, seeded(seed));
      expect(p).toHaveLength(20);
      expect(new Set(p.slice(0, 8)).size).toBe(8);
      expect(new Set(p.slice(8, 16)).size).toBe(8);
      expect(new Set(p.slice(16, 20)).size).toBe(4);
    }
  });
  it('never puts the same id twice in a row, also across cycles', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const p = pickPrompts(['x', 'y', 'z'], 30, seeded(seed));
      for (let i = 1; i < p.length; i++) {
        expect(p[i]).not.toBe(p[i - 1]);
      }
    }
  });
  it('works with two ids and random always returning the same value', () => {
    const p = pickPrompts(['x', 'y'], 7, () => 0);
    for (let i = 1; i < p.length; i++) {
      expect(p[i]).not.toBe(p[i - 1]);
    }
  });
  it('handles empty input, zero count and a single id', () => {
    expect(pickPrompts([], 6)).toEqual([]);
    expect(pickPrompts(IDS, 0)).toEqual([]);
    expect(pickPrompts(['only'], 3)).toEqual(['only', 'only', 'only']);
  });
  it('does not change the input array', () => {
    const copy = [...IDS];
    pickPrompts(IDS, 8, seeded(3));
    expect(IDS).toEqual(copy);
  });
  it('is random by default', () => {
    expect(pickPrompts(IDS, 6)).toHaveLength(6);
  });
});

describe('createRound / currentPromptId', () => {
  it('starts at the first prompt with empty counters', () => {
    const s = createRound(['a', 'b']);
    expect(s).toEqual({ promptIds: ['a', 'b'], index: 0, attempts: 0, consecutiveFails: 0, hintLevel: 0, results: [], attemptLog: [], finished: false });
    expect(currentPromptId(s)).toBe('a');
  });
  it('an empty round is finished with no current prompt', () => {
    const s = createRound([]);
    expect(s.finished).toBe(true);
    expect(currentPromptId(s)).toBeNull();
  });
});

describe('recognized answers (BR-11, BR-13)', () => {
  it('first-try success gives 2 stars and moves on', () => {
    const { state, feedback } = applyResult(createRound(['a', 'b']), ok, 5);
    expect(feedback).toBe('correct');
    expect(state.results).toEqual([{ promptId: 'a', outcome: 'correct', stars: 2, attempts: 1 }]);
    expect(currentPromptId(state)).toBe('b');
    expect(state.attempts).toBe(0);
  });
  it('success after one fail (no hint yet) still gives 2 stars', () => {
    const { state } = play(createRound(['a', 'b']), [bad, ok]);
    expect(state.results[0]).toEqual({ promptId: 'a', outcome: 'correct', stars: 2, attempts: 2 });
  });
  it('success after a hint was shown gives 1 star', () => {
    const { state } = play(createRound(['a', 'b']), [bad, bad, ok]);
    expect(state.results[0]).toEqual({ promptId: 'a', outcome: 'correct_with_hint', stars: 1, attempts: 3 });
  });
  it('one result per prompt only', () => {
    const { state } = play(createRound(['a', 'b', 'c']), [ok, bad, bad, ok]);
    expect(state.results.map((r) => r.promptId)).toEqual(['a', 'b']);
  });
  it('success on the last allowed attempt still counts', () => {
    const { state, feedback } = play(createRound(['a', 'b']), [bad, bad, bad, bad, ok]);
    expect(feedback).toBe('correct');
    expect(state.results[0]).toMatchObject({ outcome: 'correct_with_hint', stars: 1, attempts: 5 });
  });
});

describe('failures and hints (BR-13)', () => {
  it('first fail gives try_again with no hint', () => {
    const { state, feedback } = applyResult(createRound(['a']), bad, 1);
    expect(feedback).toBe('try_again');
    expect(state).toMatchObject({ consecutiveFails: 1, hintLevel: 0, attempts: 1 });
  });
  it('hint only after 2 consecutive fails, levels rise to 3, then move on', () => {
    const { feedbacks, state } = play(createRound(['a', 'b']), [bad, bad, bad, bad]);
    expect(feedbacks).toEqual(['try_again', 'hint', 'hint', 'hint']);
    expect(state.hintLevel).toBe(3);
    expect(state.consecutiveFails).toBe(4);
  });
  it('hint level goes 0, 1, 2, 3', () => {
    let s = createRound(['a', 'b']);
    const levels = [];
    for (let i = 0; i < 4; i++) {
      s = applyResult(s, silent, i).state;
      levels.push(s.hintLevel);
    }
    expect(levels).toEqual([0, 1, 2, 3]);
  });
  it('no_response counts as a failure like incorrect', () => {
    const { feedbacks } = play(createRound(['a']), [silent, bad]);
    expect(feedbacks).toEqual(['try_again', 'hint']);
  });
  it('hint level never exceeds the maximum with a larger attempt cap', () => {
    let s = createRound(['a', 'b']);
    for (let i = 0; i < 7; i++) {
      s = applyResult(s, bad, i, { MAX_ATTEMPTS: 10 }).state;
    }
    expect(s.hintLevel).toBe(3);
    expect(s.consecutiveFails).toBe(7);
  });
});

describe('inconclusive answers (BR-22)', () => {
  it('gives unclear and is not a failure', () => {
    const { state, feedback } = applyResult(createRound(['a', 'b']), unclear, 1);
    expect(feedback).toBe('unclear');
    expect(state).toMatchObject({ consecutiveFails: 0, hintLevel: 0, attempts: 1, index: 0 });
  });
  it('never moves toward a hint', () => {
    const { feedbacks, state } = play(createRound(['a', 'b']), [unclear, unclear, unclear, unclear]);
    expect(feedbacks).toEqual(['unclear', 'unclear', 'unclear', 'unclear']);
    expect(state.hintLevel).toBe(0);
  });
  it('does not reset an existing fail streak', () => {
    const { state } = play(createRound(['a', 'b']), [bad, unclear]);
    expect(state.consecutiveFails).toBe(1);
    expect(state.hintLevel).toBe(0);
    const next = applyResult(state, bad, 9);
    expect(next.feedback).toBe('hint');
  });
  it('a later success without a hint still gives 2 stars', () => {
    const { state } = play(createRound(['a', 'b']), [unclear, unclear, ok]);
    expect(state.results[0]).toMatchObject({ outcome: 'correct', stars: 2, attempts: 3 });
  });
});

describe('maximum attempts (UC-5 E2)', () => {
  it('moves on after 5 failed attempts with 0 stars', () => {
    const { state, feedback, feedbacks } = play(createRound(['a', 'b']), [bad, bad, bad, bad, bad]);
    expect(feedbacks.slice(0, 4)).toEqual(['try_again', 'hint', 'hint', 'hint']);
    expect(feedback).toBe('moving_on');
    expect(state.results).toEqual([{ promptId: 'a', outcome: 'inconclusive', stars: 0, attempts: 5 }]);
    expect(currentPromptId(state)).toBe('b');
  });
  it('4 attempts are not enough to move on', () => {
    expect(play(createRound(['a', 'b']), [bad, bad, bad, bad]).state.index).toBe(0);
  });
  it('five inconclusive attempts also end the prompt', () => {
    const { state, feedback } = play(createRound(['a', 'b']), [unclear, unclear, unclear, unclear, unclear]);
    expect(feedback).toBe('moving_on');
    expect(state.results[0]).toMatchObject({ outcome: 'inconclusive', stars: 0, attempts: 5 });
  });
  it('mixed no-success attempts reach the cap', () => {
    const { feedback } = play(createRound(['a', 'b']), [bad, unclear, silent, unclear, bad]);
    expect(feedback).toBe('moving_on');
  });
  it('honours a config override', () => {
    const s = createRound(['a', 'b']);
    const r = applyResult(s, bad, 1, { MAX_ATTEMPTS: 1 });
    expect(r.feedback).toBe('moving_on');
    expect(r.state.index).toBe(1);
  });
  it('honours config for hints and stars', () => {
    const cfg = { HINT_AFTER_FAILS: 1, STARS_CORRECT: 3, STARS_WITH_HINT: 2 };
    let r = applyResult(createRound(['a', 'b']), bad, 1, cfg);
    expect(r.feedback).toBe('hint');
    r = applyResult(r.state, ok, 2, cfg);
    expect(r.state.results[0].stars).toBe(2);
    expect(applyResult(createRound(['a']), ok, 1, cfg).state.results[0].stars).toBe(3);
  });
});

describe('moving to the next prompt', () => {
  it('resets attempts, consecutiveFails and hintLevel', () => {
    const { state } = play(createRound(['a', 'b']), [bad, bad, bad, ok]);
    expect(state).toMatchObject({ attempts: 0, consecutiveFails: 0, hintLevel: 0, index: 1 });
  });
  it('the next prompt starts with no hint', () => {
    const { feedback } = play(createRound(['a', 'b']), [bad, bad, ok, bad]);
    expect(feedback).toBe('try_again');
  });
});

describe('attempt log (Table 4.2)', () => {
  it('records every attempt with the hint level in effect when it was made', () => {
    const { state } = play(createRound(['a', 'b']), [bad, unclear, bad, ok, silent]);
    expect(state.attemptLog).toEqual([
      { promptId: 'a', status: 'incorrect', score: 20, hintLevel: 0, at: 1000 },
      { promptId: 'a', status: 'inconclusive', score: 40, hintLevel: 0, at: 1001 },
      { promptId: 'a', status: 'incorrect', score: 20, hintLevel: 0, at: 1002 },
      { promptId: 'a', status: 'recognized', score: 90, hintLevel: 1, at: 1003 },
      { promptId: 'b', status: 'no_response', score: 0, hintLevel: 0, at: 1004 },
    ]);
  });
  it('does not mutate the previous state', () => {
    const s = createRound(['a', 'b']);
    const snapshot = JSON.parse(JSON.stringify(s));
    applyResult(s, bad, 1);
    expect(s).toEqual(snapshot);
  });
});

describe('finishing a round', () => {
  it('finishes after the last prompt and has no current prompt', () => {
    const { state, feedback } = play(createRound(['a', 'b']), [ok, ok]);
    expect(feedback).toBe('correct');
    expect(state.finished).toBe(true);
    expect(currentPromptId(state)).toBeNull();
  });
  it('finishes when the last prompt is skipped after max attempts', () => {
    const { state, feedback } = play(createRound(['a']), [bad, bad, bad, bad, bad]);
    expect(feedback).toBe('moving_on');
    expect(state.finished).toBe(true);
  });
  it('further results change nothing', () => {
    const done = play(createRound(['a']), [ok]).state;
    const r = applyResult(done, bad, 99);
    expect(r.state).toBe(done);
    expect(r.feedback).toBeNull();
    expect(r.state.attemptLog).toHaveLength(1);
  });
  it('runs a full default-size round', () => {
    const ids = pickPrompts(IDS, GAME.ROUND_SIZE, seeded(7));
    let s = createRound(ids);
    ids.forEach(() => {
      s = applyResult(s, ok, 1).state;
    });
    expect(s.finished).toBe(true);
    expect(s.results).toHaveLength(6);
  });
});

describe('summarize', () => {
  it('totals stars and counts outcomes', () => {
    const { state } = play(createRound(['a', 'b', 'c', 'd']), [
      ok, // a: correct, 2
      bad, bad, ok, // b: with hint, 1
      bad, bad, bad, bad, bad, // c: inconclusive, 0
    ]);
    expect(summarize(state)).toEqual({ stars: 3, correct: 2, practiced: 3, inconclusive: 1 });
  });
  it('is zero for a new round', () => {
    expect(summarize(createRound(['a']))).toEqual({ stars: 0, correct: 0, practiced: 0, inconclusive: 0 });
  });
});

describe('reviewer checks (BR-11, BR-12, BR-22)', () => {
  const POSITIVE = ['correct', 'unclear', 'try_again', 'hint', 'moving_on'];
  const statuses = [ok, bad, silent, unclear];

  it('feedback is always one of the positive values and outcomes are never "incorrect"', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rnd = seeded(seed);
      let s = createRound(['a', 'b', 'c', 'd', 'e', 'f']);
      let guard = 0;
      while (!s.finished && guard++ < 100) {
        const r = applyResult(s, statuses[Math.floor(rnd() * statuses.length)], guard);
        expect(POSITIVE).toContain(r.feedback);
        s = r.state;
      }
      expect(s.finished).toBe(true);
      s.results.forEach((res) => {
        expect(['correct', 'correct_with_hint', 'inconclusive']).toContain(res.outcome);
        expect(res.stars).toBeLessThanOrEqual(GAME.STARS_CORRECT);
      });
      expect(s.results).toHaveLength(6);
      expect(new Set(s.results.map((res) => res.promptId)).size).toBe(6);
    }
  });

  it('an inconclusive attempt after a hint keeps the hint and a later success earns the reduced reward', () => {
    const { state, feedbacks } = play(createRound(['a', 'b']), [bad, bad, unclear, ok]);
    expect(feedbacks).toEqual(['try_again', 'hint', 'unclear', 'correct']);
    expect(state.results[0]).toMatchObject({ outcome: 'correct_with_hint', stars: GAME.STARS_WITH_HINT, attempts: 4 });
  });

  it('a skipped prompt is never counted as correct and gives no stars', () => {
    const { state } = play(createRound(['a']), [unclear, unclear, unclear, unclear, unclear]);
    expect(summarize(state)).toEqual({ stars: 0, correct: 0, practiced: 1, inconclusive: 1 });
  });
});
