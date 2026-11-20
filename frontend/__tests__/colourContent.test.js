import { COLOUR_MATCHING, colourItem, colourItemIds } from '../src/modules/m03_games/colourContent';
import { hintText } from '../src/modules/m03_games/itemShape';

const { items } = COLOUR_MATCHING;

describe('Colour matching content (UC-12, BR-10)', () => {
  test('ids are unique and a round fits', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(colourItemIds(1).length).toBeGreaterThanOrEqual(6);
    expect(colourItem('red').id).toBe('red');
  });

  test.each(items.map((i) => [i.id, i]))('%s has both languages, a clue and a swatch', (_id, item) => {
    expect(item.swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
    ['en', 'ur'].forEach((lang) => {
      const { word, accepted, clue } = item[lang];
      expect(word.trim()).not.toBe('');
      expect(clue.trim()).not.toBe('');
      expect(accepted).toContain(word);
    });
    expect(item.ur.accepted.join('')).toMatch(/[؀-ۿ]/);
    expect(item.ur.accepted.join('')).not.toMatch(/[يك]/);
  });

  test('swatches are different and no accepted word belongs to two colours', () => {
    expect(new Set(items.map((i) => i.swatch)).size).toBe(items.length);
    ['en', 'ur'].forEach((lang) => {
      const all = items.flatMap((i) => i[lang].accepted);
      expect(new Set(all).size).toBe(all.length);
    });
  });

  test('the hint ladder works on colours', () => {
    const red = colourItem('red');
    expect(hintText(red, 'en', 1)).toBe(red.en.clue);
    expect(hintText(red, 'en', 2)).toBe('It starts with "r".');
    expect(hintText(red, 'ur', 3)).toContain('لال');
  });
  test('accepted words are trimmed and in the right script; Urdu uses heh goal', () => {
    items.forEach((i) => {
      i.en.accepted.forEach((a) => expect(a).toMatch(/^[a-z ]+$/));
      i.ur.accepted.forEach((a) => expect(a).toMatch(/^[\u0600-\u06FF ]+$/));
      expect([...i.ur.accepted, i.ur.clue].join('')).not.toMatch(/\u0647/);
    });
  });

  test('every hint level is a non-empty string for every colour', () => {
    items.forEach((i) => ['en', 'ur'].forEach((lang) => [1, 2, 3].forEach((lvl) => {
      expect(hintText(i, lang, lvl).length).toBeGreaterThan(0);
    })));
  });

  test('unknown id returns undefined', () => {
    expect(colourItem('nope')).toBeUndefined();
  });
  test('the clue (hint level 1) never says the answer itself (BR-12 ladder)', () => {
    items.forEach((i) => ['en', 'ur'].forEach((lang) => {
      const clue = i[lang].clue.toLowerCase();
      i[lang].accepted.forEach((a) => expect(clue.includes(a)).toBe(false));
    }));
  });
});
