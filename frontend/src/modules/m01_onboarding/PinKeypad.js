import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';
import { PIN_TEXT } from './pinText';

const ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], [null, '0', 'delete']];

/**
 * Numbers-only PIN keypad with 72dp round keys (design: parent_gate_pin_verification).
 * Keys stay in the same place and use Western digits in Urdu too; only the Delete label changes.
 */
export default function PinKeypad({ onDigit, onDelete, disabled = false, language }) {
  const lang = useScreenLanguage(language);
  const deleteLabel = PIN_TEXT[lang].delete;
  return <View style={styles.pad}>
    {ROWS.map((row, r) => <View key={r} style={styles.row}>
      {row.map((key, k) => {
        if (key === null) return <View key={k} style={styles.key} />;
        const isDelete = key === 'delete';
        return <Pressable
          key={k}
          testID={`pin-key-${key}`}
          disabled={disabled}
          onPress={() => (isDelete ? onDelete() : onDigit(key))}
          accessibilityRole="button"
          accessibilityLabel={isDelete ? deleteLabel : key}
          accessibilityState={{ disabled }}
          style={({ pressed }) => [styles.key, isDelete ? styles.deleteKey : styles.digitKey, pressed && styles.pressed, disabled && styles.disabled]}>
          {isDelete
            ? <><Text style={styles.deleteIcon}>⌫</Text><Text style={[textStyle('labelSm', lang), styles.deleteText]}>{deleteLabel}</Text></>
            : <Text style={[textStyle('headlineLg'), styles.digit]}>{key}</Text>}
        </Pressable>;
      })}
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  pad: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.field },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  key: { width: touch.child, height: touch.child, borderRadius: touch.child / 2, alignItems: 'center', justifyContent: 'center' },
  digitKey: { backgroundColor: colors.card, ...shadows.card },
  deleteKey: { backgroundColor: colors.surface },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  digit: { color: colors.text },
  deleteIcon: { fontSize: 20, color: colors.text },
  deleteText: { color: colors.textMuted },
});
