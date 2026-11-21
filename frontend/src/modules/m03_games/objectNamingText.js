import { GAME_TEXT } from './gameText';

// Object naming wording on top of the shared game messages.
export const NAMING_TEXT = {
  en: {
    ...GAME_TEXT.en,
    ask: 'What is this?',
    next: 'Next word',
    summary: (c, n) => `You named ${c} of ${n} things!`,
    tried: (n) => `You tried ${n} things!`,
  },
  ur: {
    ...GAME_TEXT.ur,
    ask: 'یہ کیا ہے؟',
    next: 'اگلا لفظ',
    summary: (c, n) => `آپ نے ${n} میں سے ${c} چیزوں کے نام بتائے!`,
    tried: (n) => `آپ نے ${n} چیزیں بولنے کی کوشش کی!`,
  },
};
