// Positive feedback lines (FR-6, BR-11). Simple spoken wording; never negative (BR-22).
export const PRAISE = {
  en: ['Super job!', 'Well done!', 'You did it!', 'Great work!', 'Amazing!'],
  ur: ['بہت خوب!', 'شاباش!', 'واہ، کمال کر دیا!', 'بہت اچھے!', 'زبردست!'],
};

export const MILESTONE_TEXT = {
  en: "Well done! Today's gold star is yours!",
  ur: 'شاباش! آج کا سنہرا ستارہ آپ کا ہے!',
};

/** A different line each time: `random` is injectable so tests can pick a known one. */
export function pickPraise(language, random = Math.random) {
  const lines = PRAISE[language] ?? PRAISE.en;
  const index = Math.min(Math.floor(random() * lines.length), lines.length - 1);
  return lines[index];
}
