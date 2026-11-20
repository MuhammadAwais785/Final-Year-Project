import {
  OBJECT_NAMING,
  hintText,
  objectItem,
  objectItemIds,
} from '../src/modules/m03_games/objectNamingContent';

const { items } = OBJECT_NAMING;

describe('Object naming content (UC-11, BR-10)', () => {
  test('ids are unique and there are enough level-1 items', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(objectItemIds(1).length).toBeGreaterThanOrEqual(6);
    expect(objectItemIds(2)).toEqual([]);
  });

  test.each(items.map((i) => [i.id, i]))('%s has both languages, accepted words and a clue', (_id, item) => {
    expect(item.icon).toBeTruthy();
    ['en', 'ur'].forEach((lang) => {
      const { word, accepted, clue } = item[lang];
      expect(word.trim()).not.toBe('');
      expect(clue.trim()).not.toBe('');
      expect(accepted).toContain(word);
    });
  });

  test('Urdu text uses Urdu letters, not Arabic forms', () => {
    items.forEach((i) => {
      const text = [...i.ur.accepted, i.ur.clue].join('');
      expect(text).not.toMatch(/[يك]/);
    });
  });

  test('hintText works for every level in both languages', () => {
    const cat = objectItem('cat');
    expect(hintText(cat, 'en', 0)).toBeNull();
    expect(hintText(cat, 'ur', 0)).toBeNull();
    expect(hintText(cat, 'en', 1)).toBe('It says meow.');
    expect(hintText(cat, 'ur', 1)).toBe(cat.ur.clue);
    expect(hintText(cat, 'en', 2)).toBe('It starts with "c".');
    expect(hintText(objectItem('apple'), 'ur', 2)).toBe('یہ "س" سے شروع ہوتا ہے۔');
    expect(hintText(objectItem('apple'), 'en', 3)).toBe('Say it with me: apple');
    expect(hintText(objectItem('apple'), 'ur', 4)).toBe('میرے ساتھ بولیں: سیب');
  });

  test('makeItem keeps accepted as a plain list of words', () => {
    expect(objectItem('cat').en.accepted).toEqual(['cat', 'kitty', 'kitten']);
    expect(Object.keys(objectItem('cat').en.accepted)).toEqual(['0', '1', '2']);
  });

  test('has 10 to 16 items (task scope)', () => {
    expect(items.length).toBeGreaterThanOrEqual(10);
    expect(items.length).toBeLessThanOrEqual(16);
  });

  test('accepted words are unique, trimmed and in the right script', () => {
    items.forEach((i) => {
      ['en', 'ur'].forEach((lang) => {
        const list = [...i[lang].accepted];
        expect(new Set(list).size).toBe(list.length);
        list.forEach((a) => expect(a).toBe(a.trim()));
      });
      i.en.accepted.forEach((a) => expect(a).toMatch(/^[a-z ]+$/));
      i.ur.accepted.forEach((a) => expect(a).toMatch(/^[\u0600-\u06FF ]+$/));
    });
  });

  test('no accepted word belongs to two different objects', () => {
    ['en', 'ur'].forEach((lang) => {
      const all = items.flatMap((i) => [...i[lang].accepted]);
      expect(new Set(all).size).toBe(all.length);
    });
  });

  test('Urdu uses heh goal (ہ), never Arabic heh (ه)', () => {
    items.forEach((i) => {
      expect([...i.ur.accepted, i.ur.clue].join('')).not.toMatch(/\u0647/);
    });
  });

  test('first-sound hint keeps a precomposed Urdu first letter (آ)', () => {
    expect(hintText(objectItem('mango'), 'ur', 2)).toBe('یہ "آ" سے شروع ہوتا ہے۔');
    expect(hintText(objectItem('egg'), 'en', 2)).toBe('It starts with "e".');
  });

  test('every hint level is a non-empty string for every item', () => {
    items.forEach((i) => {
      ['en', 'ur'].forEach((lang) => {
        [1, 2, 3].forEach((lvl) => {
          const h = hintText(i, lang, lvl);
          expect(typeof h).toBe('string');
          expect(h.length).toBeGreaterThan(0);
        });
      });
    });
  });

  test('unknown id returns undefined', () => {
    expect(objectItem('nope')).toBeUndefined();
  });
});
