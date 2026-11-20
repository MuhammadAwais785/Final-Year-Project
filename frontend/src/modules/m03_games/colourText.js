import { GAME_TEXT } from './gameText';

// Colour matching wording on top of the shared game messages.
export const COLOUR_TEXT = {
  en: {
    ...GAME_TEXT.en,
    ask: 'What colour is this?',
    next: 'Next colour',
    summary: (c, n) => `You named ${c} of ${n} colours!`,
    tried: (n) => `You tried ${n} colours!`,
  },
  ur: {
    ...GAME_TEXT.ur,
    ask: 'یہ کون سا رنگ ہے؟',
    next: 'اگلا رنگ',
    summary: (c, n) => `آپ نے ${n} میں سے ${c} رنگوں کے نام بتائے!`,
    tried: (n) => `آپ نے ${n} رنگ بولنے کی کوشش کی!`,
  },
};
