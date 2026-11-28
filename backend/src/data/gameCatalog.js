const CONTENT_VERSION = 'v1';

const GAME_CATALOG = {
  object_naming: {
    id: 'object_naming',
    available: true,
    title: { en: 'What is this?', ur: 'یہ کیا ہے؟' },
    items: [
      { id: 'apple', icon: '🍎', level: 1, en: { accepted: ['apple'], clue: 'It is a red fruit that is crunchy.' }, ur: { accepted: ['سیب'], clue: 'یہ لال اور مزیدار پھل ہے۔' } },
      { id: 'banana', icon: '🍌', level: 1, en: { accepted: ['banana'], clue: 'It is a yellow fruit with a peel.' }, ur: { accepted: ['کیلا'], clue: 'یہ پیلا پھل ہے جس پر چھلکا ہوتا ہے۔' } },
      { id: 'mango', icon: '🥭', level: 1, en: { accepted: ['mango'], clue: 'It is a sweet fruit that grows in summer.' }, ur: { accepted: ['آم'], clue: 'یہ گرمیوں کا میٹھا پھل ہے۔' } },
      { id: 'ball', icon: '⚽', level: 1, en: { accepted: ['ball'], clue: 'It is round and we kick or throw it.' }, ur: { accepted: ['گیند', 'بال'], clue: 'یہ گول ہوتی ہے اور ہم اس سے کھیلتے ہیں۔' } },
      { id: 'cat', icon: '🐱', level: 1, en: { accepted: ['cat', 'kitty', 'kitten'], clue: 'It says meow.' }, ur: { accepted: ['بلی', 'بلّی'], clue: 'یہ میاؤں میاؤں کرتی ہے۔' } },
      { id: 'dog', icon: '🐶', level: 1, en: { accepted: ['dog', 'doggy', 'puppy'], clue: 'It says woof.' }, ur: { accepted: ['کتا', 'کتّا'], clue: 'یہ بھوں بھوں کرتا ہے۔' } },
      { id: 'fish', icon: '🐟', level: 1, en: { accepted: ['fish'], clue: 'It swims in the water.' }, ur: { accepted: ['مچھلی'], clue: 'یہ پانی میں تیرتی ہے۔' } },
      { id: 'duck', icon: '🦆', level: 1, en: { accepted: ['duck'], clue: 'It says quack quack.' }, ur: { accepted: ['بطخ'], clue: 'یہ قیں قیں کرتی ہے۔' } },
      { id: 'bird', icon: '🐦', level: 1, en: { accepted: ['bird'], clue: 'It has wings and can fly.' }, ur: { accepted: ['چڑیا', 'پرندہ'], clue: 'اس کے پر ہوتے ہیں اور یہ اڑتی ہے۔' } },
      { id: 'car', icon: '🚗', level: 1, en: { accepted: ['car'], clue: 'It has four wheels and goes on the road.' }, ur: { accepted: ['گاڑی', 'کار'], clue: 'اس کے چار پہیے ہوتے ہیں اور یہ سڑک پر چلتی ہے۔' } },
      { id: 'book', icon: '📖', level: 1, en: { accepted: ['book'], clue: 'We read stories in it.' }, ur: { accepted: ['کتاب'], clue: 'ہم اس میں کہانیاں پڑھتے ہیں۔' } },
      { id: 'milk', icon: '🥛', level: 1, en: { accepted: ['milk'], clue: 'It is a white drink that helps us grow.' }, ur: { accepted: ['دودھ'], clue: 'یہ سفید ہوتا ہے اور ہم اسے پیتے ہیں۔' } },
      { id: 'egg', icon: '🥚', level: 1, en: { accepted: ['egg'], clue: 'It comes from a hen.' }, ur: { accepted: ['انڈا'], clue: 'یہ مرغی دیتی ہے۔' } },
      { id: 'sun', icon: '☀️', level: 1, en: { accepted: ['sun'], clue: 'It shines bright in the sky.' }, ur: { accepted: ['سورج'], clue: 'یہ آسمان میں چمکتا ہے۔' } },
      { id: 'tree', icon: '🌳', level: 1, en: { accepted: ['tree'], clue: 'It has a trunk and green leaves.' }, ur: { accepted: ['درخت', 'پیڑ'], clue: 'اس کے سبز پتے ہوتے ہیں۔' } },
      { id: 'house', icon: '🏠', level: 1, en: { accepted: ['house', 'home'], clue: 'It is where we live.' }, ur: { accepted: ['گھر', 'مکان'], clue: 'یہ وہ جگہ ہے جہاں ہم رہتے ہیں۔' } }
    ]
  },
  colour_matching: {
    id: 'colour_matching',
    available: true,
    title: { en: 'Colours', ur: 'رنگ' },
    items: [
      { id: 'red', swatch: '#E53935', level: 1, en: { accepted: ['red'], clue: 'It is the colour of a ripe tomato.' }, ur: { accepted: ['لال', 'سرخ'], clue: 'یہ ٹماٹر کا رنگ ہے۔' } },
      { id: 'blue', swatch: '#1E88E5', level: 1, en: { accepted: ['blue'], clue: 'It is the colour of the sky.' }, ur: { accepted: ['نیلا'], clue: 'یہ آسمان کا رنگ ہے۔' } },
      { id: 'green', swatch: '#43A047', level: 1, en: { accepted: ['green'], clue: 'It is the colour of grass and leaves.' }, ur: { accepted: ['ہرا', 'سبز'], clue: 'یہ گھاس اور پتوں کا رنگ ہے۔' } },
      { id: 'yellow', swatch: '#FDD835', level: 1, en: { accepted: ['yellow'], clue: 'It is the colour of the sun and a banana.' }, ur: { accepted: ['پیلا'], clue: 'یہ سورج اور کیلے کا رنگ ہے۔' } },
      { id: 'orange', swatch: '#FB8C00', level: 1, en: { accepted: ['orange'], clue: 'It is the colour of a carrot.' }, ur: { accepted: ['نارنجی', 'مالٹا'], clue: 'یہ مالٹے کا رنگ ہے۔' } },
      { id: 'purple', swatch: '#8E24AA', level: 1, en: { accepted: ['purple'], clue: 'It is the colour of grapes.' }, ur: { accepted: ['جامنی'], clue: 'یہ جامن کا رنگ ہے۔' } },
      { id: 'pink', swatch: '#F06292', level: 1, en: { accepted: ['pink'], clue: 'It is the colour of a rose.' }, ur: { accepted: ['گلابی'], clue: 'یہ گلاب کے پھول کا رنگ ہے۔' } },
      { id: 'black', swatch: '#212121', level: 1, en: { accepted: ['black'], clue: 'It is the colour of the night sky.' }, ur: { accepted: ['کالا', 'سیاہ'], clue: 'یہ رات کا رنگ ہے۔' } },
      { id: 'white', swatch: '#FFFFFF', level: 1, en: { accepted: ['white'], clue: 'It is the colour of milk and snow.' }, ur: { accepted: ['سفید'], clue: 'یہ دودھ اور برف کا رنگ ہے۔' } },
      { id: 'brown', swatch: '#795548', level: 1, en: { accepted: ['brown'], clue: 'It is the colour of chocolate.' }, ur: { accepted: ['بھورا'], clue: 'یہ چاکلیٹ کا رنگ ہے۔' } }
    ]
  },
  sound_imitation: {
    id: 'sound_imitation',
    available: false,
    title: { en: 'Copy the sound', ur: 'آواز دہرائیں' },
    items: []
  }
};

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function listActivities() {
  return Object.values(GAME_CATALOG).map(({ id, available, title, items }) => ({
    id,
    available,
    title,
    itemCount: items.length
  }));
}

function getGameContent({ activity, level } = {}) {
  let keys = Object.keys(GAME_CATALOG);
  if (activity !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(GAME_CATALOG, activity)) {
      throw badRequest('Unknown game activity');
    }
    keys = [activity];
  }

  let parsedLevel = null;
  if (level !== undefined) {
    parsedLevel = Number(level);
    if (!Number.isInteger(parsedLevel) || parsedLevel < 1 || parsedLevel > 3) {
      throw badRequest('level must be an integer between 1 and 3');
    }
  }

  const activities = {};
  for (const key of keys) {
    const entry = GAME_CATALOG[key];
    activities[key] = {
      id: entry.id,
      available: entry.available,
      title: entry.title,
      items: parsedLevel === null
        ? entry.items
        : entry.items.filter((item) => item.level === parsedLevel)
    };
  }

  return { version: CONTENT_VERSION, activities };
}

module.exports = { CONTENT_VERSION, GAME_CATALOG, listActivities, getGameContent };
