import fs from 'fs';
import path from 'path';
import { colors, fonts, textStyle, touch, typography } from '../src/theme';

const FONT_DIR = path.join(__dirname, '../src/assets/fonts');

describe('theme', () => {
  test('uses the design system background colours', () => {
    expect(colors.childBackground).toBe('#FFF8F0');
    expect(colors.parentBackground).toBe('#F5F7FA');
  });

  test('touch targets meet UI-9 (at least 48dp, 72dp for children)', () => {
    expect(touch.parent).toBeGreaterThanOrEqual(48);
    expect(touch.child).toBeGreaterThanOrEqual(72);
  });

  test('Urdu line height is at least 1.8x the font size so Nastaliq is not clipped', () => {
    Object.values(typography.ur).forEach(({ fontSize, lineHeight }) => {
      expect(lineHeight / fontSize).toBeGreaterThanOrEqual(1.8);
    });
  });

  test('every font name has a font file, and every text weight has a font', () => {
    ['en', 'ur'].forEach((lang) => {
      Object.values(fonts[lang]).forEach((name) => {
        expect(fs.existsSync(path.join(FONT_DIR, `${name}.ttf`))).toBe(true);
      });
      Object.values(typography[lang]).forEach(({ fontWeight }) => {
        expect(fonts[lang][fontWeight]).toBeDefined();
      });
    });
  });

  test('textStyle picks the English font file for the weight, without fontWeight', () => {
    const style = textStyle('headlineMd');
    expect(style).toEqual({ fontSize: 24, lineHeight: 32, fontFamily: 'PlusJakartaSans-Bold' });
  });

  test('textStyle returns right-to-left Urdu styles, falling back for sizes Urdu lacks', () => {
    expect(textStyle('body', 'ur')).toEqual({
      fontSize: 15, lineHeight: 34, fontFamily: 'NotoNastaliqUrdu-Regular', writingDirection: 'rtl', textAlign: 'right',
    });
    expect(textStyle('label', 'ur')).toMatchObject({ fontSize: 15, fontFamily: 'NotoNastaliqUrdu-Regular' });
    expect(textStyle('display', 'ur')).toMatchObject({ fontSize: 26, fontFamily: 'NotoNastaliqUrdu-Bold' });
  });

  test('unknown variants fall back to body', () => {
    expect(textStyle('nope')).toMatchObject({ fontSize: 16, fontFamily: 'PlusJakartaSans-Regular' });
  });
});
