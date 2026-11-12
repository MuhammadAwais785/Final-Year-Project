import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChildProfileProvider, useChildProfile } from '../context/ChildProfileContext';
import ChildProfileScreen from '../modules/m01_onboarding/ChildProfileScreen';
import ConsentScreen from '../modules/m01_onboarding/ConsentScreen';
import HomeScreen from '../modules/m01_onboarding/HomeScreen';
import PinScreen from '../modules/m01_onboarding/PinScreen';
import * as pinStore from '../modules/m01_onboarding/pinStore';
import ChildHomeScreen from '../modules/m03_games/ChildHomeScreen';
import { colors, radius, spacing, textStyle } from '../theme';

/**
 * Developer-only gallery to open each screen with sample data, for reviews and screenshots
 * before navigation is wired. Not part of the real app flow.
 * To use: in App.js, temporarily render <ScreenGallery /> instead of the app, then undo it.
 */
const ALI = { _id: 'sample-ali', name: 'Ali', age: 5, language: 'en' };
const ALI_UR = { _id: 'sample-ali-ur', name: 'علی', age: 5, language: 'ur' };

export const SCREENS = [
  { id: 'home', title: 'Home (Child Mode / Parent Portal)', render: (back) => <HomeScreen onChildMode={back} onParentPortal={back} /> },
  { id: 'pin', title: 'Parent PIN', render: (back) => <PinScreen store={pinStore} onUnlocked={back} onBack={back} onForgotPin={back} /> },
  { id: 'add-child', title: 'Add a child', render: (back) => <ChildProfileScreen onBack={back} onSaved={back} /> },
  { id: 'consent', title: 'Consent and permissions', child: ALI, render: (back) => <ConsentScreen onBack={back} onSaved={back} /> },
  { id: 'child-home-en', title: 'Child Mode home (English)', child: ALI, render: (back) => <ChildHomeScreen stars={12} onSelectGame={back} onExit={back} /> },
  { id: 'child-home-ur', title: 'Child Mode home (Urdu)', child: ALI_UR, render: (back) => <ChildHomeScreen stars={12} onSelectGame={back} onExit={back} /> },
];

function SampleChild({ child }) {
  const { setChild } = useChildProfile();
  useEffect(() => setChild(child || null), [child, setChild]);
  return null;
}

export default function ScreenGallery() {
  const [openId, setOpenId] = useState(null);
  const open = SCREENS.find((s) => s.id === openId);
  const back = () => setOpenId(null);

  return <ChildProfileProvider>
    {open
      ? <><SampleChild child={open.child} />{open.render(back)}</>
      : <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[textStyle('headlineMd'), styles.title]}>Screen gallery (dev only)</Text>
          {SCREENS.map((s) => <Pressable key={s.id} testID={`open-${s.id}`} onPress={() => setOpenId(s.id)} style={styles.item}>
            <Text style={[textStyle('labelLg'), styles.title]}>{s.title}</Text>
          </Pressable>)}
        </ScrollView>
      </SafeAreaView>}
  </ChildProfileProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.sm },
  title: { color: colors.text },
  item: { padding: spacing.md, borderRadius: radius.input, backgroundColor: colors.card },
});
