import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../../theme';

/** One calm sound choice (design: calming_break_soothing_sounds). Selected = lavender highlight. */
export default function SoundTile({ title, icon, selected, language = 'en', onPress, testID }) {
  return <Pressable
    testID={testID}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityState={{ selected }}
    style={[styles.tile, language === 'ur' && styles.rtl, selected && styles.selected]}>
    <View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View>
    <Text style={[textStyle('bodyLg', language), styles.title]}>{title}</Text>
    {selected && <Text style={styles.check}>{'✓'}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touch.childMain,
    padding: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.card,
  },
  rtl: { flexDirection: 'row-reverse' },
  selected: { backgroundColor: colors.lavender, borderColor: colors.lavender },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.childBackground, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 28 },
  title: { flex: 1, color: colors.childText },
  check: { fontSize: 24, color: colors.childText },
});
