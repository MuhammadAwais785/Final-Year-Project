import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

export default function PrimaryButton({ title, onPress }) {
  return <Pressable style={styles.button} onPress={onPress}><Text style={styles.text}>{title}</Text></Pressable>;
}
const styles = StyleSheet.create({
  button: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
