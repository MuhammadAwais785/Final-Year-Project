import React from 'react';
import { Modal as NativeModal, View, StyleSheet } from 'react-native';

export default function Modal({ visible, children, onRequestClose }) {
  return <NativeModal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
    <View style={styles.backdrop}><View style={styles.content}>{children}</View></View>
  </NativeModal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#00000066' },
  content: { backgroundColor: '#fff', borderRadius: 14, padding: 20 }
});
