/**
 * Object Naming content (UC-11). BR-10: every target word has English and
 * Urdu script. Item shape is shared with colour matching (Task 10).
 */
export const makeItem = (id, icon, en, ur, level = 1) => ({
  id,
  icon,
  level,
  en: { word: en.accepted[0], accepted: en.accepted, clue: en.clue },
  ur: { word: ur.accepted[0], accepted: ur.accepted, clue: ur.clue },
});

export const OBJECT_NAMING = {
  version: 'v1',
  items: [
    makeItem('apple', '🍎', { accepted: ['apple'], clue: 'It is a red fruit that is crunchy.' }, { accepted: ['سیب'], clue: 'یہ لال اور مزیدار پھل ہے۔' }),
    makeItem('banana', '🍌', { accepted: ['banana'], clue: 'It is a yellow fruit with a peel.' }, { accepted: ['کیلا'], clue: 'یہ پیلا پھل ہے جس پر چھلکا ہوتا ہے۔' }),
    makeItem('mango', '🥭', { accepted: ['mango'], clue: 'It is a sweet fruit that grows in summer.' }, { accepted: ['آم'], clue: 'یہ گرمیوں کا میٹھا پھل ہے۔' }),
    makeItem('ball', '⚽', { accepted: ['ball'], clue: 'It is round and we kick or throw it.' }, { accepted: ['گیند', 'بال'], clue: 'یہ گول ہوتی ہے اور ہم اس سے کھیلتے ہیں۔' }),
    makeItem('cat', '🐱', { accepted: ['cat', 'kitty', 'kitten'], clue: 'It says meow.' }, { accepted: ['بلی', 'بلّی'], clue: 'یہ میاؤں میاؤں کرتی ہے۔' }),
    makeItem('dog', '🐶', { accepted: ['dog', 'doggy', 'puppy'], clue: 'It says woof.' }, { accepted: ['کتا', 'کتّا'], clue: 'یہ بھوں بھوں کرتا ہے۔' }),
    makeItem('fish', '🐟', { accepted: ['fish'], clue: 'It swims in the water.' }, { accepted: ['مچھلی'], clue: 'یہ پانی میں تیرتی ہے۔' }),
    makeItem('duck', '🦆', { accepted: ['duck'], clue: 'It says quack quack.' }, { accepted: ['بطخ'], clue: 'یہ قیں قیں کرتی ہے۔' }),
    makeItem('bird', '🐦', { accepted: ['bird'], clue: 'It has wings and can fly.' }, { accepted: ['چڑیا', 'پرندہ'], clue: 'اس کے پر ہوتے ہیں اور یہ اڑتی ہے۔' }),
    makeItem('car', '🚗', { accepted: ['car'], clue: 'It has four wheels and goes on the road.' }, { accepted: ['گاڑی', 'کار'], clue: 'اس کے چار پہیے ہوتے ہیں اور یہ سڑک پر چلتی ہے۔' }),
    makeItem('book', '📖', { accepted: ['book'], clue: 'We read stories in it.' }, { accepted: ['کتاب'], clue: 'ہم اس میں کہانیاں پڑھتے ہیں۔' }),
    makeItem('milk', '🥛', { accepted: ['milk'], clue: 'It is a white drink that helps us grow.' }, { accepted: ['دودھ'], clue: 'یہ سفید ہوتا ہے اور ہم اسے پیتے ہیں۔' }),
    makeItem('egg', '🥚', { accepted: ['egg'], clue: 'It comes from a hen.' }, { accepted: ['انڈا'], clue: 'یہ مرغی دیتی ہے۔' }),
    makeItem('sun', '☀️', { accepted: ['sun'], clue: 'It shines bright in the sky.' }, { accepted: ['سورج'], clue: 'یہ آسمان میں چمکتا ہے۔' }),
    makeItem('tree', '🌳', { accepted: ['tree'], clue: 'It has a trunk and green leaves.' }, { accepted: ['درخت', 'پیڑ'], clue: 'اس کے سبز پتے ہوتے ہیں۔' }),
    makeItem('house', '🏠', { accepted: ['house', 'home'], clue: 'It is where we live.' }, { accepted: ['گھر', 'مکان'], clue: 'یہ وہ جگہ ہے جہاں ہم رہتے ہیں۔' }),
  ],
};

export const objectItem = (id) => OBJECT_NAMING.items.find((i) => i.id === id);

export const objectItemIds = (level = 1) =>
  OBJECT_NAMING.items.filter((i) => i.level === level).map((i) => i.id);

/** Hint ladder (BR-12): 0 none, 1 clue, 2 first sound, 3+ say it with me. */
export function hintText(item, language, level) {
  if (!level || level < 1) return null;
  const { word, clue } = item[language];
  if (level === 1) return clue;
  if (level === 2) {
    const first = Array.from(word)[0];
    return language === 'ur' ? `یہ "${first}" سے شروع ہوتا ہے۔` : `It starts with "${first}".`;
  }
  return language === 'ur' ? `میرے ساتھ بولیں: ${word}` : `Say it with me: ${word}`;
}
