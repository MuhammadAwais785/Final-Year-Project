import { makeWordItem } from './itemShape';

/**
 * Colour matching content (UC-12). BR-10: English and Urdu for every colour.
 * `swatch` is content data (the colour the child must name), not UI styling,
 * so the hex values live here and not in theme.js.
 */
const makeColour = (id, swatch, en, ur) => ({ ...makeWordItem(id, en, ur), swatch });

export const COLOUR_MATCHING = {
  version: 'v1',
  items: [
    makeColour('red', '#E53935', { accepted: ['red'], clue: 'It is the colour of a ripe tomato.' }, { accepted: ['لال', 'سرخ'], clue: 'یہ ٹماٹر کا رنگ ہے۔' }),
    makeColour('blue', '#1E88E5', { accepted: ['blue'], clue: 'It is the colour of the sky.' }, { accepted: ['نیلا'], clue: 'یہ آسمان کا رنگ ہے۔' }),
    makeColour('green', '#43A047', { accepted: ['green'], clue: 'It is the colour of grass and leaves.' }, { accepted: ['ہرا', 'سبز'], clue: 'یہ گھاس اور پتوں کا رنگ ہے۔' }),
    makeColour('yellow', '#FDD835', { accepted: ['yellow'], clue: 'It is the colour of the sun and a banana.' }, { accepted: ['پیلا'], clue: 'یہ سورج اور کیلے کا رنگ ہے۔' }),
    makeColour('orange', '#FB8C00', { accepted: ['orange'], clue: 'It is the colour of a carrot.' }, { accepted: ['نارنجی', 'مالٹا'], clue: 'یہ مالٹے کا رنگ ہے۔' }),
    makeColour('purple', '#8E24AA', { accepted: ['purple'], clue: 'It is the colour of grapes.' }, { accepted: ['جامنی'], clue: 'یہ جامن کا رنگ ہے۔' }),
    makeColour('pink', '#F06292', { accepted: ['pink'], clue: 'It is the colour of a rose.' }, { accepted: ['گلابی'], clue: 'یہ گلاب کے پھول کا رنگ ہے۔' }),
    makeColour('black', '#212121', { accepted: ['black'], clue: 'It is the colour of the night sky.' }, { accepted: ['کالا', 'سیاہ'], clue: 'یہ رات کا رنگ ہے۔' }),
    makeColour('white', '#FFFFFF', { accepted: ['white'], clue: 'It is the colour of milk and snow.' }, { accepted: ['سفید'], clue: 'یہ دودھ اور برف کا رنگ ہے۔' }),
    makeColour('brown', '#795548', { accepted: ['brown'], clue: 'It is the colour of chocolate.' }, { accepted: ['بھورا'], clue: 'یہ چاکلیٹ کا رنگ ہے۔' }),
  ],
};

export const colourItem = (id) => COLOUR_MATCHING.items.find((i) => i.id === id);

export const colourItemIds = (level = 1) =>
  COLOUR_MATCHING.items.filter((i) => i.level === level).map((i) => i.id);
