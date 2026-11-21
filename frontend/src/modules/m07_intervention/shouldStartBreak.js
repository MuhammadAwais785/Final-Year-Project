/**
 * M07 — Trigger: shouldStartBreak
 *
 * Decides whether the child needs a calming break based on recent
 * stress/frustration indicators from M05 vision (BR-27, FR-15).
 *
 * Rules:
 *   • Only trigger when stress stays ABOVE the threshold for a
 *     SUSTAINED window — not on a single spike (BR-27).
 *   • The window size and threshold live in constants.js (TBD-04).
 *   • When a break is needed, also record WHICH activity caused the
 *     stress so CalmingBreakScreen can route to an easier game after.
 *
 * Usage (called by the game screens, not by M07 UI):
 *   const { startBreak, stressedActivity } = shouldStartBreak(recentIndicators, currentActivity);
 *   if (startBreak) navigate('CalmingBreak', { stressedActivity });
 *
 * @param {object[]} recentIndicators
 *   Array of indicator snapshots from subscribeIndicators() (M05).
 *   Each: { stress: 0–1, frustration: 0–1, boredom: 0–1, confidence: 0–1, at: number }
 *   Must be sorted oldest-first. Pass the last N seconds only (see BREAK.WINDOW_MS).
 *
 * @param {string} currentActivity
 *   The game id currently being played (e.g. 'objectNaming').
 *   Stored as stressedActivity so the post-break routing can avoid it.
 *
 * @returns {{ startBreak: boolean, stressedActivity: string|null }}
 */

import { BREAK } from '../../utils/constants';

export function shouldStartBreak(recentIndicators = [], currentActivity = null) {
  // Need at least a full window of data before making a call
  if (!recentIndicators || recentIndicators.length === 0) {
    return { startBreak: false, stressedActivity: null };
  }

  const windowMs  = BREAK.WINDOW_MS;        // e.g. 10 000 ms
  const threshold = BREAK.STRESS_THRESHOLD; // e.g. 0.65

  const now     = recentIndicators[recentIndicators.length - 1].at;
  const cutoff  = now - windowMs;

  // Only look at indicators inside the window
  const window = recentIndicators.filter((r) => r.at >= cutoff);

  if (window.length < BREAK.MIN_SAMPLES) {
    // Not enough data yet — don't trigger
    return { startBreak: false, stressedActivity: null };
  }

  // All samples in the window must be above the threshold (sustained, not a spike)
  const allAbove = window.every((r) => r.stress >= threshold);

  if (allAbove) {
    console.log(
      `[M07] shouldStartBreak: sustained stress ≥ ${threshold} for ${window.length} samples → break`,
    );
    return { startBreak: true, stressedActivity: currentActivity };
  }

  return { startBreak: false, stressedActivity: null };
}
