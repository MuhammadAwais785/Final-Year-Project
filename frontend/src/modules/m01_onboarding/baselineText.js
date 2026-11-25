/** Baseline check wording in English and Urdu (UI-04, FR-2, UI-8). */
export const BASELINE_TEXT = {
  en: {
    title: 'Baseline check',
    task: (n, total) => `Task ${n} of ${total}`,
    attempt: (n, max) => `Attempt ${n} of ${max}`,
    ask: 'Ask child to name the object',
    answer: 'Answer',
    said: 'Child said it',
    tryAgain: 'Try again',
    skip: 'Skip',
    later: 'Save and continue later',
    blocked: (date) => `A baseline check was completed recently. The next one can be done from ${date}.`,
  },
  ur: {
    title: 'ابتدائی جائزہ',
    task: (n, total) => `ٹاسک ${n} از ${total}`,
    attempt: (n, max) => `کوشش ${n} از ${max}`,
    ask: 'بچے سے کہیں کہ وہ چیز کا نام بتائے',
    answer: 'جواب',
    said: 'بچے نے بول دیا',
    tryAgain: 'دوبارہ کوشش کریں',
    skip: 'چھوڑ دیں',
    later: 'محفوظ کریں اور بعد میں جاری رکھیں',
    blocked: (date) => `ابتدائی جائزہ حال ہی میں مکمل ہوا ہے۔ اگلا جائزہ ${date} سے کیا جا سکتا ہے۔`,
  },
};

export const URDU_MONTHS = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون', 'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];

/** A date as text in the screen language: "Mon Nov 16 2026" in English, "16 نومبر 2026" in Urdu. */
export function formatDate(date, language) {
  return language === 'ur' ? `${date.getDate()} ${URDU_MONTHS[date.getMonth()]} ${date.getFullYear()}` : date.toDateString();
}
