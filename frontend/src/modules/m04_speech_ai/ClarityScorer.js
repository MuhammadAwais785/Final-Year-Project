/**
 * M04 — Speech AI: Clarity Scorer
 *
 * Compares what the child said (transcript) to the expected word and returns
 * a clarity score from 0 to 100. Works for both English and Urdu (BR-3).
 *
 * Scoring rules (simple, no external API needed — runs fully on device):
 *  - Exact match              → 100
 *  - Starts-with match        → 85
 *  - Contains expected        → 70
 *  - Levenshtein distance ≤ 2 → 60 (close enough, e.g. "aple" vs "apple")
 *  - Levenshtein distance ≤ 4 → 40 (partial attempt)
 *  - No match                 → 0
 */

/** Levenshtein edit distance between two strings (small words only). */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalise a word: lowercase, strip diacritics (for Urdu transliteration),
 * trim punctuation and extra spaces.
 */
function normalise(word) {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // Arabic/Urdu diacritics
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .trim();
}

/**
 * scoreClarity(transcript, expectedWord) → { score: 0–100, label: string }
 *
 * @param {string} transcript   - What the speech engine heard
 * @param {string} expectedWord - The word the child should say
 * @returns {{ score: number, label: 'perfect'|'good'|'try_again'|'no_match' }}
 */
export function scoreClarity(transcript, expectedWord) {
  const heard = normalise(transcript);
  const target = normalise(expectedWord);

  if (!heard || !target) return { score: 0, label: 'no_match' };

  // Exact match
  if (heard === target) return { score: 100, label: 'perfect' };

  // Check each word in a multi-word transcript
  const words = heard.split(/\s+/);
  for (const w of words) {
    if (w === target) return { score: 100, label: 'perfect' };
    if (w.startsWith(target) || target.startsWith(w))
      return { score: 85, label: 'good' };
    if (w.includes(target) || target.includes(w))
      return { score: 70, label: 'good' };
    const dist = editDistance(w, target);
    if (dist <= 2) return { score: 60, label: 'good' };
    if (dist <= 4) return { score: 40, label: 'try_again' };
  }

  return { score: 0, label: 'no_match' };
}

/** Human-readable feedback text for a score label (bilingual). */
export const CLARITY_FEEDBACK = {
  perfect: { en: 'Perfect! ⭐', ur: 'شاباش! ⭐' },
  good: { en: 'Good try! Almost!', ur: 'بہت اچھا! قریب ہے!' },
  try_again: { en: 'Try again!', ur: 'دوبارہ کوشش کریں!' },
  no_match: { en: "I didn't hear that. Try again!", ur: 'سمجھ نہیں آیا۔ دوبارہ کوشش کریں!' },
};
