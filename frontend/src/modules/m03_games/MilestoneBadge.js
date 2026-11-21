import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyle } from '../../theme';
import { MILESTONE_TEXT } from './rewardText';

/** Daily star badge (FR-8). Static on purpose: nothing flashes or pulses (BR-30). */
export default function MilestoneBadge({ language = 'en' }) {
  const rtl = language === 'ur';
  return <View testID="milestone-badge" accessible accessibilityLabel={MILESTONE_TEXT[language]} style={[styles.badge, rtl && styles.rowRtl]}>
    <Text style={styles.star}>★</Text>
    <Text style={[textStyle('label', language), styles.text, rtl && styles.textRtl]}>{MILESTONE_TEXT[language]}</Text>
  </View>;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.starBorder,
    backgroundColor: colors.starBackground,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  star: { fontSize: 24, color: colors.star },
  text: { color: colors.onStar, flexShrink: 1 },
  textRtl: { writingDirection: 'rtl', textAlign: 'right' },
});
