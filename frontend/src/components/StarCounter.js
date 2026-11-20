import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme';

/** One star and the child's star total (design rule: never a second ★). Western digits in both languages. */
export default function StarCounter({ count = 0, language = 'en' }) {
  return <View
    accessible
    accessibilityLabel={language === 'ur' ? `${count} ستارے` : `${count} stars`}
    style={[styles.chip, language === 'ur' && styles.rowRtl]}>
    <Text style={styles.star}>★</Text>
    <Text style={styles.count}>{count}</Text>
  </View>;
}

const styles = StyleSheet.create({
  chip: {
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
  star: { fontSize: 20, color: colors.star },
  count: { fontFamily: fonts.en[800], fontSize: 16, lineHeight: 22, color: colors.onStar },
});
