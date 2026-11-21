/**
 * M06 — Difficulty: nextDifficulty
 *
 * Decides what level a child should play at next and which higher levels
 * have been unlocked (BR-14, BR-4, FR-14).
 *
 * Rules:
 *   • Start from the child's baseline level (stored in baselineStore).
 *   • Promote one step after PROMOTE_AFTER_CORRECT correct answers IN A ROW.
 *   • Only promote between rounds, never mid-round (BR-14).
 *   • Never demote — once a level is unlocked it stays unlocked.
 *   • Log every change (console.log is fine until M10 dashboard lands).
 *
 * Levels: 'easy' → 'medium' → 'hard'
 *
 * Usage:
 *   const { level, unlocked } = nextDifficulty(childId, activity, history);
 *   // level    — the level to play next
 *   // unlocked — array of levels unlocked so far, e.g. ['easy', 'medium']
 *
 * @param {string}   childId   - child profile id
 * @param {string}   activity  - game id, e.g. 'objectNaming' | 'colourMatching'
 * @param {object[]} history   - recent round results:
 *                               [{ correct: boolean, level: string }, ...]
 *                               Most-recent entry LAST.
 * @returns {{ level: string, unlocked: string[] }}
 */

import { DIFFICULTY } from '../../utils/constants';

const LEVELS = ['easy', 'medium', 'hard'];

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
function derivedUnlocked(history, baselineLevel) {
  const seen = new Set([baselineLevel]);
  history.forEach((r) => seen.add(r.level));
  return LEVELS.filter((l) => seen.has(l));
}

export function nextDifficulty(childId, activity, history = []) {
  // Determine current level from the last history entry, else start at easy
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const currentLevel = lastEntry?.level ?? 'easy';
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
    console.log(
      `[M06] ${childId}/${activity}: promoted ${currentLevel} → ${nextLevel} after ${streak} correct in a row`,
    );
    return { level: nextLevel, unlocked };
  }

  return { level: currentLevel, unlocked };
}
