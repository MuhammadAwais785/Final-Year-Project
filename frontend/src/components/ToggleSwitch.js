import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows } from '../theme';

/** On/off switch matching the design (56x32 track, white knob with a tick when on). */
export default function ToggleSwitch({ value, onValueChange, label, testID, disabled = false }) {
  return <Pressable
    testID={testID}
    onPress={() => onValueChange(!value)}
    disabled={disabled}
    hitSlop={8}
    accessibilityRole="switch"
    accessibilityLabel={label}
    accessibilityState={{ checked: value, disabled }}
    style={[styles.track, value ? styles.trackOn : styles.trackOff, disabled && styles.disabled]}>
    <View style={[styles.knob, value && styles.knobOn]}>
      <Text style={[styles.mark, value ? styles.markOn : styles.markOff]}>{value ? '✓' : '✕'}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  track: { width: 56, height: 32, padding: 4, borderRadius: radius.pill, justifyContent: 'center' },
  trackOn: { backgroundColor: colors.primary },
  trackOff: { backgroundColor: colors.border },
  disabled: { opacity: 0.5 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  knobOn: { transform: [{ translateX: 24 }] },
  mark: { fontSize: 12, fontWeight: '700' },
  markOn: { color: colors.primary },
  markOff: { color: colors.textMuted },
});
