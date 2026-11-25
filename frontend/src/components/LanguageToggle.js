import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, textStyle, touch } from '../theme';
import { LANGUAGES } from '../utils/constants';

const OPTIONS = [
  { value: LANGUAGES.ENGLISH, label: 'EN' },
  { value: LANGUAGES.URDU, label: 'اردو' },
];

/** EN | اردو chip for the parent's app language (UI-8, BR-3; designs: parent_portal_home_urdu). */
export default function LanguageToggle({ language, onChange, style }) {
  return <View style={[styles.chip, style]} accessibilityRole="radiogroup" accessibilityLabel="Language / زبان">
    {OPTIONS.map((o) => {
      const selected = o.value === language;
      return <Pressable
        key={o.value}
        testID={`lang-${o.value}`}
        onPress={() => onChange?.(o.value)}
        accessibilityRole="radio"
        accessibilityLabel={o.value === LANGUAGES.URDU ? 'اردو' : 'English'}
        accessibilityState={{ selected }}
        style={[styles.option, selected && styles.selected]}>
        <Text style={[textStyle('labelSm', o.value), selected ? styles.onSelected : styles.muted]}>{o.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', padding: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.toggle },
  // Each option is at least the parent touch size (BR-2 / UI-3).
  option: { minWidth: touch.parent, minHeight: touch.parent, paddingHorizontal: spacing.sm, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.primary },
  onSelected: { color: colors.onPrimary },
  muted: { color: colors.textMuted },
});
