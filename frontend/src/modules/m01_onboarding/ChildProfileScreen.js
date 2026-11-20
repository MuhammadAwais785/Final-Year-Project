import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createProfile } from '../../api/profiles';
import { FieldError } from '../../components/FieldText';
import ScreenHeader from '../../components/ScreenHeader';
import { useChildProfile } from '../../context/ChildProfileContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import ChildProfileForm from './ChildProfileForm';

const ERRORS = {
  session: 'Your session has ended. Please log in again.',
  network: 'Could not save the profile. Check your internet and try again.',
};

/**
 * UI-02 / FR-1 (design: add_a_child): add a child profile and save it to the guardian's account.
 * On success the new child becomes the active child and onSaved(profile) is called.
 */
export default function ChildProfileScreen({ onBack, onSaved }) {
  const { setChild } = useChildProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const savingRef = useRef(false); // blocks a second tap before React re-renders

  const save = async (profile) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const { data } = await createProfile(profile);
      setChild(data);
      onSaved?.(data);
    } catch (e) {
      setError(e.response?.status === 401 ? ERRORS.session : ERRORS.network);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader title="Add a child" onBack={onBack} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, styles.intro]}>
        <View style={styles.avatar}><Text style={styles.avatarIcon}>{'☺︎'}</Text></View>
        <Text style={[textStyle('labelLg'), styles.introText]}>New Profile Setup</Text>
      </View>
      <View style={styles.card}>
        <ChildProfileForm onSubmit={save} submitTitle={saving ? 'Saving…' : 'Save profile'} />
        <FieldError>{error}</FieldError>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.lg, ...shadows.card },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatarIcon: { fontSize: 30, color: colors.primary },
  introText: { color: colors.text },
});
