import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, textStyle, touch } from '../theme';

const TAIL = 14;

/**
 * What the Doctor says, shown as a speech bubble (design: Child Mode and game screens).
 * tail: 'bottom' (Doctor below) or 'side' (Doctor beside; left in English, right in Urdu).
 * tone: 'default' (white card) or 'hint' (peach card with a lightbulb, for a game hint).
 * onReplay shows a speaker button so the child can hear the line again (UI-7).
 */
export default function SpeechBubble({ text, language = 'en', tail = 'bottom', variant = 'headlineSm', tone = 'default', onReplay }) {
  const rtl = language === 'ur';
  const hint = tone === 'hint';
  const tailStyle = tail === 'side' ? (rtl ? styles.tailRight : styles.tailLeft) : styles.tailBottom;
  return <View style={[styles.bubble, hint && styles.hintBubble, rtl && styles.rowRtl]}>
    <View style={[styles.tail, tailStyle, hint && styles.hintTail]} />
    {hint && <Text style={styles.hintIcon}>{'\u{1F4A1}'}</Text>}
    <Text accessibilityLiveRegion="polite" style={[textStyle(variant, language), styles.text, hint && styles.hintText]}>{text}</Text>
    {onReplay && <Pressable
      onPress={onReplay}
      accessibilityRole="button"
      accessibilityLabel={rtl ? 'دوبارہ سنیں' : 'Hear it again'}
      style={styles.replay}>
      <Text style={styles.replayIcon}>{'\u{1F50A}'}</Text>
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.bubble,
    backgroundColor: colors.card,
    ...shadows.raised,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  hintBubble: { backgroundColor: colors.peach },
  hintTail: { backgroundColor: colors.peach },
  hintIcon: { fontSize: 20 },
  text: { flexShrink: 1, color: colors.text, textAlign: 'center' },
  hintText: { color: colors.onPeach },
  tail: { position: 'absolute', width: TAIL, height: TAIL, backgroundColor: colors.card, transform: [{ rotate: '45deg' }] },
  tailBottom: { bottom: -TAIL / 2, left: '50%', marginLeft: -TAIL / 2 },
  tailLeft: { left: -TAIL / 2, top: '50%', marginTop: -TAIL / 2 },
  tailRight: { right: -TAIL / 2, top: '50%', marginTop: -TAIL / 2 },
  replay: {
    width: touch.parent,
    height: touch.parent,
    borderRadius: touch.parent / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayIcon: { fontSize: 20 },
});
