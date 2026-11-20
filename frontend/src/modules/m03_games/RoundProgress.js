import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

/** One dot per word; filled up to and including the current one. */
export default function RoundProgress({ total, done, language = 'en' }) {
  return <View
    accessible
    accessibilityLabel={language === 'ur' ? `${done} / ${total}` : `${done} of ${total}`}
    style={[styles.row, language === 'ur' && styles.rtl]}>
    {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.dot, i < done && styles.dotDone]} />)}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.card },
  rtl: { flexDirection: 'row-reverse' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.sky },
  dotDone: { backgroundColor: colors.primary },
});
