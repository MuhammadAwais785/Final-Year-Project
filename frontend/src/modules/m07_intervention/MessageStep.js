import React from 'react';
import { StyleSheet, View } from 'react-native';
import ActionButton from '../../components/ActionButton';
import SpeechBubble from '../../components/SpeechBubble';
import { spacing } from '../../theme';
import DoctorAvatar from '../m02_avatar/DoctorAvatar';

/** The Doctor says one line and the child taps one button: used by the start and ready steps. */
export default function MessageStep({ message, buttonTitle, buttonTestID, language, variant, onPress }) {
  return <View style={styles.wrap}>
    <SpeechBubble text={message} language={language} variant="childTitle" />
    <DoctorAvatar size={220} language={language} />
    <View style={styles.action}>
      <ActionButton testID={buttonTestID} title={buttonTitle} variant={variant} language={language} onPress={onPress} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  action: { alignSelf: 'stretch' },
});
