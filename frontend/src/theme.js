// Design tokens from docs/design/DESIGN.md. Use these instead of hard-coded values.

export const colors = {
  // Child Mode
  childBackground: '#FFF8F0',
  sky: '#A8DADC',
  peach: '#FFD6A5',
  mint: '#B9E4C9',
  lavender: '#CDB4DB',
  clay: '#D97736',
  // Parent Portal, Home and PIN
  parentBackground: '#F5F7FA',
  card: '#FFFFFF',
  primary: '#3D7EA6',
  primaryDark: '#186288',
  onPrimary: '#FFFFFF',
  // Shared
  text: '#2D3142',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#58B399',
  error: '#C25450',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36, screen: 20 };

export const radius = { input: 16, card: 24, pill: 9999 };

// Minimum touch target heights in dp (UI-9).
export const touch = { parent: 48, child: 72, childMain: 88 };

export const fonts = {
  en: 'PlusJakartaSans',
  ur: 'NotoNastaliqUrdu',
};

// Urdu Nastaliq needs about twice the line height of English or letters get clipped.
export const typography = {
  en: {
    display: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
    headlineLg: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    headlineMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    headlineSm: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    bodyLg: { fontSize: 18, fontWeight: '500', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    labelSm: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  },
  ur: {
    headlineLg: { fontSize: 26, fontWeight: '700', lineHeight: 54 },
    headlineMd: { fontSize: 22, fontWeight: '700', lineHeight: 48 },
    bodyLg: { fontSize: 18, fontWeight: '500', lineHeight: 40 },
    body: { fontSize: 15, fontWeight: '400', lineHeight: 34 },
  },
};

/**
 * Text style for a language: font, size and direction.
 * Urdu has no display/label sizes, so those fall back to the closest Urdu style.
 */
const URDU_FALLBACK = { display: 'headlineLg', headlineSm: 'headlineMd', label: 'body', labelSm: 'body' };

export function textStyle(variant, language = 'en') {
  if (language === 'ur') {
    const style = typography.ur[variant] || typography.ur[URDU_FALLBACK[variant]] || typography.ur.body;
    return { ...style, fontFamily: fonts.ur, writingDirection: 'rtl', textAlign: 'right' };
  }
  return { ...(typography.en[variant] || typography.en.body), fontFamily: fonts.en };
}

// Soft shadows tinted with the text colour (elevation for Android, shadow* for iOS).
const shadow = (elevation, opacity, radiusPx, offsetY) => ({
  elevation,
  shadowColor: colors.text,
  shadowOpacity: opacity,
  shadowRadius: radiusPx,
  shadowOffset: { width: 0, height: offsetY },
});

export const shadows = {
  card: shadow(2, 0.05, 8, 4),
  raised: shadow(4, 0.08, 10, 6),
  modal: shadow(8, 0.14, 18, 16),
};
