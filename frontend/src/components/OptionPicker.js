import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Single choice from a few options, shown as tappable chips. options: [{ label, value }] */
export default function OptionPicker({ label, options, value, onChange, error, style }) {
  return <View style={style} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return <Pressable
          key={String(option.value)}
          testID={`option-${option.value}`}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
          onPress={() => onChange(option.value)}
          style={[styles.chip, selected && styles.chipSelected]}>
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
        </Pressable>;
      })}
    </View>
    {error && <Text style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  label: { fontWeight: '700', color: '#172554', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 48, minHeight: 48, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 16, color: '#172554' },
  chipTextSelected: { color: '#fff', fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 4 }
});
