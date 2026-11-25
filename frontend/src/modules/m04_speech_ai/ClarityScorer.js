/**
 * M04 — Speech AI: Clarity Scorer
 *
 * Compares what the child said (transcript) to the expected word and returns
 * a clarity score from 0 to 100. Works for both English and Urdu (BR-3).
 *
 * Scoring rules (simple, no external API needed — runs fully on device):
 *  - Exact match                                   → 100
 *  - Targets of 4 letters or fewer: only the word plus one ending letter
 *    ("cat" → "cats")                              → 85; anything else → 0
 *  - Targets of 5+ letters: one letter more or less at the end ("appl", "apples") → 85,
 *    otherwise edit distance ≤ 1 ("aple" vs "apple") → 60
 *  - No match                                      → 0
 */

// Targets shorter than this need an exact match; longer ones allow one slip.
const MIN_LENGTH_FOR_TYPO = 5;

/** Levenshtein edit distance between two strings (small words only). */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp.push([]);
    for (let j = 0; j <= n; j++) {
      dp[i].push(i === 0 ? j : j === 0 ? i : 0);
    }
  }
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
    .replace(/[\u064A\u0649]/g, '\u06CC') // ي ى → ی
    .replace(/\u0643/g, '\u06A9') // ك → ک
    .replace(/\u0647/g, '\u06C1') // ه → ہ
    .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
    .trim();
}

/**
 * scoreClarity(transcript, expectedWord) → { score: 0–100, label: string }
 *
 * @param {string} transcript   - What the speech engine heard
 * @param {string} expectedWord - The word the child should say
 * @returns {{ score: number, label: 'perfect'|'good'|'no_match' }}
 */
export function scoreClarity(transcript, expectedWord) {
  const heard = normalise(transcript);
  const target = normalise(expectedWord);

  if (!heard || !target) return { score: 0, label: 'no_match' };

  // Exact match
  if (heard === target) return { score: 100, label: 'perfect' };

  // Check each word in a multi-word transcript — keep the BEST score across all words.
  // (Early return caused "I see apple" → 'see' scored 40 before 'apple' was checked.)
  let bestScore = 0;
  let bestLabel = 'no_match';

  const words = heard.split(/\s+/);
  for (const w of words) {
    let score = 0;
    const gap = Math.abs(w.length - target.length);
    if (w === target) score = 100;
    else if (target.length < MIN_LENGTH_FOR_TYPO) {
      // Short words: exact, or the word plus one ending letter (cat → cats)
      if (w.length === target.length + 1 && w.startsWith(target)) score = 85;
    } else if (gap <= 1 && (w.startsWith(target) || target.startsWith(w))) score = 85;
    else if (editDistance(w, target) <= 1) score = 60;
    if (score > bestScore) {
      bestScore = score;
      bestLabel = score === 100 ? 'perfect' : 'good';
    }
    if (bestScore === 100) break; // perfect — no need to check further
  }

  return { score: bestScore, label: bestLabel };
}
