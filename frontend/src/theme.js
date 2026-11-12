// Design tokens from docs/design/DESIGN.md. Use these instead of hard-coded values.

export const colors = {
  // Child Mode
  childBackground: '#FFF8F0',
  sky: '#A8DADC',
  peach: '#FFD6A5',
  mint: '#B9E4C9',
  lavender: '#CDB4DB',
  clay: '#D97736',
  childText: '#2D3748',
  onSky: '#1D4E68', // text and icons on sky / peach / mint tiles
  onPeach: '#7B3F00',
  onMint: '#155E3D',
  starBackground: '#FFECC7',
  starBorder: '#FFDC99',
  star: '#E68A00',
  onStar: '#754400',
  childChipBorder: '#FFE7D1',
  exitBackground: '#EFE7DE',
  exitBorder: '#DFCFC2',
  // Home screen mode cards (design: app_home_mode_selection)
  childCard: '#FFDBCA',
  onChildCard: '#331200',
  clayDark: '#944A1A', // Child Mode button and Urdu title
  clayLight: '#FE9E67',
  parentCard: '#E4E7FE',
  primarySoft: '#C8E6FF',
  toggle: '#DEE1F8',
  // Parent Portal, Home and PIN (values from docs/design/html)
  parentBackground: '#FAF8FF',
  card: '#FFFFFF',
  field: '#F3F2FF', // inputs and unselected chips
  surface: '#EBEDFF', // icon circles, toggles
  primary: '#186288',
  primaryLight: '#397BA3',
  onPrimary: '#FFFFFF',
  // Shared
  text: '#171B2B',
  textMuted: '#40484E',
  border: '#C0C7CF',
  success: '#006954',
  error: '#BA1A1A',
  errorLight: '#FFDAD6',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36, screen: 20 };

export const radius = { input: 16, bubble: 24, card: 32, pill: 9999 };

// Minimum touch target heights in dp (UI-9). Form fields and chips use `field`.
export const touch = { parent: 48, field: 56, child: 72, childMain: 88 };

// One font file per weight (src/assets/fonts). Android and iOS both load them by these names.
export const fonts = {
  en: {
    400: 'PlusJakartaSans-Regular',
    500: 'PlusJakartaSans-Medium',
    600: 'PlusJakartaSans-SemiBold',
    700: 'PlusJakartaSans-Bold',
    800: 'PlusJakartaSans-ExtraBold',
  },
  ur: {
    400: 'NotoNastaliqUrdu-Regular',
    500: 'NotoNastaliqUrdu-Medium',
    700: 'NotoNastaliqUrdu-Bold',
  },
};

// Urdu Nastaliq needs about twice the line height of English or letters get clipped.
export const typography = {
  en: {
    display: { fontSize: 32, fontWeight: '800', lineHeight: 40 },
    headlineLg: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
    headlineMd: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
    headlineSm: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    childTitle: { fontSize: 20, fontWeight: '800', lineHeight: 28 }, // child tiles and the Doctor's bubble
    bodyLg: { fontSize: 18, fontWeight: '500', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    labelLg: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
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
 * Text style for a language: font file, size and direction.
 * The weight is carried by the font file, so fontWeight is not set (Android would fake it).
 * Urdu has no display/label sizes, so those fall back to the closest Urdu style.
 */
const URDU_FALLBACK = {
  display: 'headlineLg', headlineSm: 'headlineMd', childTitle: 'headlineMd', labelLg: 'bodyLg', label: 'body', labelSm: 'body',
};

export function textStyle(variant, language = 'en') {
  const urdu = language === 'ur';
  const table = urdu ? typography.ur : typography.en;
  const { fontWeight, ...style } = table[variant] || (urdu && table[URDU_FALLBACK[variant]]) || table.body;
  const fontFamily = fonts[urdu ? 'ur' : 'en'][fontWeight];
  return urdu ? { ...style, fontFamily, writingDirection: 'rtl', textAlign: 'right' } : { ...style, fontFamily };
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
