import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Waveform({ active = false }) {
  return <View style={styles.row}>{[10, 20, 32, 18, 26, 14, 24].map((height, index) =>
    <View key={index} style={[styles.bar, { height }, active && styles.active]} />)}</View>;
}

const styles = StyleSheet.create({
  row: { height: 36, flexDirection: 'row', alignItems: 'center', gap: 4 },
  bar: { width: 5, borderRadius: 3, backgroundColor: colors.border },
  active: { backgroundColor: colors.primary },
});
