import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

/** A big rounded colour square to name (UC-12). The label is the colour word for screen readers. */
export default function SwatchCard({ color, label }) {
  return <View accessible accessibilityLabel={label} testID="swatch" style={[styles.swatch, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  swatch: { width: 144, height: 144, borderRadius: radius.card, borderWidth: 2, borderColor: colors.border },
});
