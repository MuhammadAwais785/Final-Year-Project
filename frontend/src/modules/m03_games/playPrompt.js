// Bridges a game item to the recogniser and back to round.applyResult (FR-11, FR-12).
const generations = new WeakMap(); // recogniser -> listen/cancel counter, to drop stale results

// Every listen or cancel takes a new token; only the newest call's result counts.
function bump(recognizer) {
  const next = (generations.get(recognizer) || 0) + 1;
  generations.set(recognizer, next);
  return next;
}

/** Result for round.applyResult, or null if cancelled or replaced by a newer listen. */
export async function listenForPrompt(recognizer, item, language, listenMs) {
  const gen = bump(recognizer);
  const { status, score } = await recognizer.recognize({
    acceptedAnswers: item[language].accepted,
    language,
    listenMs,
  });
  if (generations.get(recognizer) !== gen) return null;
  return { status, score };
}

// Use this instead of recognizer.cancel() so a late result is ignored.
export function cancelListening(recognizer) {
  bump(recognizer);
  recognizer.cancel();
}
