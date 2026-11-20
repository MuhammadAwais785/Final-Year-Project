/**
 * Shared shape of a speech game item (BR-10: English and Urdu for every target word).
 * Used by object naming and colour matching.
 */
export const makeWordItem = (id, en, ur, level = 1) => ({
  id,
  level,
  en: { word: en.accepted[0], accepted: en.accepted, clue: en.clue },
  ur: { word: ur.accepted[0], accepted: ur.accepted, clue: ur.clue },
});

/** Hint ladder (BR-12): 0 none, 1 clue, 2 first sound, 3+ say it with me. */
export function hintText(item, language, level) {
  if (!level || level < 1) return null;
  const { word, clue } = item[language];
  if (level === 1) return clue;
  if (level === 2) {
    const first = Array.from(word)[0];
    return language === 'ur' ? `یہ "${first}" سے شروع ہوتا ہے۔` : `It starts with "${first}".`;
  }
  return language === 'ur' ? `میرے ساتھ بولیں: ${word}` : `Say it with me: ${word}`;
}
