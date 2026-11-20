const rank = (a) => a.level ?? Infinity; // an activity without a level goes last

/**
 * Choose what the child plays after a calming break (BR-28): the easiest available
 * activity that is not the one that caused the stress. Pure; never touches stars or progress.
 * Returns the activity id, or null.
 */
export function pickActivityAfterBreak({ stressedActivity, activities }) {
  const available = (activities || []).filter((a) => a && a.available);
  let best = null;
  for (const a of available) {
    if (a.id === stressedActivity) continue;
    if (!best || rank(a) < rank(best)) best = a; // strict < keeps list order on ties
  }
  if (best) return best.id;
  if (available.some((a) => a.id === stressedActivity)) return stressedActivity;
  return null;
}
