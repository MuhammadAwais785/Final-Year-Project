import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';

/** The object to name: big picture and its word in the child's language (UI-3). `correct` adds a tick. */
export default function PromptCard({ item, language, correct = false }) {
  return <View style={styles.card}>
    <View>
      <Text accessibilityLabel={item[language].word} style={styles.icon}>{item.icon}</Text>
      {correct && <View testID="correct-tick" style={styles.tick}><Text style={styles.tickMark}>✓</Text></View>}
    </View>
    <Text style={[textStyle('display', language), styles.word]}>{item[language].word}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.card, ...shadows.raised },
  icon: { fontSize: 120, lineHeight: 144, textAlign: 'center' },
  word: { color: colors.childText },
  tick: { position: 'absolute', right: -8, bottom: 0, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  tickMark: { fontSize: 24, color: colors.onPrimary },
});
