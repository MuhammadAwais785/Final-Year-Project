import { colors, fonts, textStyle, touch, typography } from '../src/theme';

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

  test('textStyle returns English styles with the English font', () => {
    expect(textStyle('headlineMd')).toEqual({ ...typography.en.headlineMd, fontFamily: fonts.en });
  });

  test('textStyle returns right-to-left Urdu styles, falling back for sizes Urdu lacks', () => {
    expect(textStyle('body', 'ur')).toMatchObject({ ...typography.ur.body, fontFamily: fonts.ur, writingDirection: 'rtl' });
    expect(textStyle('label', 'ur')).toMatchObject(typography.ur.body);
    expect(textStyle('display', 'ur')).toMatchObject(typography.ur.headlineLg);
  });

  test('unknown variants fall back to body', () => {
    expect(textStyle('nope')).toMatchObject(typography.en.body);
  });
});
