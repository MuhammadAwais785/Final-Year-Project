/**
 * M06 — Difficulty: nextDifficulty
 *
 * Decides what level a child should play at next and which higher levels
 * have been unlocked (BR-14, BR-4, FR-14).
 *
 * Rules:
 *   • Start at level 1, or at the last level played (the baseline is not used here).
 *   • Promote one step after PROMOTE_AFTER_CORRECT correct answers IN A ROW.
 *   • Only promote between rounds, never mid-round (BR-14).
 *   • Never demote — once a level is unlocked it stays unlocked.
 *
 * Levels are the numbers in LEVELS (constants.js): 1 → 2 → 3
 *
 * Usage:
 *   const { level, unlocked } = nextDifficulty(childId, activity, history);
 *   // level    — the level to play next
 *   // unlocked — array of levels unlocked so far, e.g. [1, 2]
 *
 * @param {string}   childId   - child profile id
 * @param {string}   activity  - game id, one of the ACTIVITIES values (constants.js)
 * @param {object[]} history   - recent round results:
 *                               [{ correct: boolean, level: number }, ...]
 *                               Most-recent entry LAST.
 * @returns {{ level: number, unlocked: number[] }}
 */

import { DIFFICULTY, LEVELS } from '../../utils/constants';

/** How many correct-in-a-row before we promote (from constants). */
const PROMOTE_AFTER = DIFFICULTY.PROMOTE_AFTER_CORRECT; // default 3

/**
 * Count trailing consecutive correct answers at the same level.
 * We only look at results from the CURRENT level to avoid double-counting.
 */
function trailingCorrect(history, currentLevel) {
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const r = history[i];
    if (r.level !== currentLevel || !r.correct) break;
    count += 1;
  }
  return count;
}

/**
 * Derive which levels are already unlocked from the history.
 * A level is unlocked if the child has ever played at it.
 */
function derivedUnlocked(history, startLevel) {
  const seen = new Set([startLevel]);
  history.forEach((r) => seen.add(r.level));
  return LEVELS.filter((l) => seen.has(l));
}

export function nextDifficulty(childId, activity, history = []) {
  // Determine current level from the last history entry, else start at level 1
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const currentLevel = lastEntry?.level ?? LEVELS[0];
  const currentIdx   = LEVELS.indexOf(currentLevel);

  const unlocked = derivedUnlocked(history, currentLevel);

  // Check for promotion
  const streak = trailingCorrect(history, currentLevel);
  const canPromote = currentIdx < LEVELS.length - 1;

  if (canPromote && streak >= PROMOTE_AFTER) {
    const nextLevel = LEVELS[currentIdx + 1];
    if (!unlocked.includes(nextLevel)) {
      unlocked.push(nextLevel);
    }
    return { level: nextLevel, unlocked };
  }

  return { level: currentLevel, unlocked };
}
