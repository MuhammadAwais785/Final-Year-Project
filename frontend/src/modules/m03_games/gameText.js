// Child-facing messages shared by the speech games, one set per language (BR-3).
// Positive wording only: no "wrong", no medical terms (UI-7, BR-22).
// Each game adds its own ask / next / summary / tried (see objectNamingText.js, colourText.js).
export const GAME_TEXT = {
  en: {
    listening: 'Listening…',
    speak: 'Tap and say it',
    tryAgain: "Nice try! Let's try again.",
    unclear: "I couldn't hear that well. Let's try once more!",
    correct: 'Great job!',
    movingOn: "That's okay! Let's try another one.",
    earned: (n) => `+${n} ${n === 1 ? 'Star' : 'Stars'}!`,
    playAgain: 'Play again',
    done: 'Done',
    exit: 'Grown-ups: hold to exit',
  },
  ur: {
    listening: 'سن رہے ہیں…',
    speak: 'دبائیں اور بولیں',
    tryAgain: 'اچھی کوشش! پھر سے بولیں۔',
    unclear: 'آواز صاف نہیں آئی۔ ایک بار اور بولیں!',
    correct: 'شاباش!',
    movingOn: 'کوئی بات نہیں! آئیں اگلی چیز دیکھیں۔',
    earned: (n) => `+${n} ${n === 1 ? 'ستارہ' : 'ستارے'}!`,
    playAgain: 'دوبارہ کھیلیں',
    done: 'ختم',
    exit: 'والدین: باہر نکلنے کے لیے دبا کر رکھیں',
  },
};
