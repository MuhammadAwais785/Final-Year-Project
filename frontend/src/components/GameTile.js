import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, textStyle } from '../theme';

const TONES = {
  sky: { background: colors.sky, text: colors.onSky },
  peach: { background: colors.peach, text: colors.onPeach },
  mint: { background: colors.mint, text: colors.onMint },
};

/** Large child-mode button: icon, one short title and an arrow; the whole tile is tappable (UI-9). */
export default function GameTile({ title, icon, tone = 'sky', onPress, language = 'en', testID }) {
  const rtl = language === 'ur';
  const { background, text } = TONES[tone];
  return <Pressable
    testID={testID}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    style={({ pressed }) => [styles.tile, rtl && styles.rowRtl, { backgroundColor: background }, pressed && styles.pressed]}>
    <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View>
    <Text numberOfLines={1} style={[textStyle('childTitle', language), styles.title, { color: text }]}>{title}</Text>
    <View style={styles.arrowCircle}><Text style={[styles.arrow, { color: text }]}>{rtl ? '←' : '→'}</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 82,
    paddingHorizontal: 20,
    borderRadius: radius.bubble,
    ...shadows.raised,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  iconBox: { width: 56, height: 56, borderRadius: radius.input, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 30 },
  title: { flex: 1 },
  arrowCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 22, fontWeight: '700' },
});
