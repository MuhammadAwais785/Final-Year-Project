import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function TextField({ label, error, style, ...inputProps }) {
  return <View style={style}>
    {label && <Text style={styles.label}>{label}</Text>}
    <TextInput style={[styles.input, error && styles.inputError]} accessibilityLabel={label} {...inputProps} />
    {error && <Text style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  label: { fontWeight: '700', color: '#172554', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 10, padding: 13 },
  inputError: { borderColor: '#dc2626' },
  error: { color: '#dc2626', marginTop: 4 }
});
