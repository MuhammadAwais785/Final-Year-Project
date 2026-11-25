import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageToggle from '../../components/LanguageToggle';
import { useLanguage, useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle, touch } from '../../theme';
import { HOME_TEXT } from './homeText';

/** One line in the screen language only (UI-8); Urdu is right to left in its own Text. */
function Line({ text, variant, color, lang, centred }) {
  return <Text style={[textStyle(variant, lang), { color }, centred && styles.centred]}>{text}</Text>;
}

function ModeCard({ testID, title, icon, iconStyle, cardStyle, titleColor, button, buttonColor, onPress, disabled, lang }) {
  const flip = lang === 'ur' && styles.flip;
  return <View style={[styles.card, cardStyle]}>
    <View style={[styles.cardTop, flip]}>
      <View style={styles.titleBox}><Line text={title} variant="headlineSm" color={titleColor} lang={lang} /></View>
      <View style={[styles.cardIcon, iconStyle]}><Text style={styles.cardIconText}>{icon}</Text></View>
    </View>
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${button.label}`}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.cardButton, flip, { backgroundColor: buttonColor }, pressed && styles.pressed, disabled && styles.disabled]}>
      <Text style={[textStyle(lang === 'ur' ? 'bodyLg' : 'labelLg', lang), styles.onButton]}>{lang === 'ur' ? button.label : `${button.icon}  ${button.label}`}</Text>
      {lang === 'ur' && <Text style={[textStyle('labelLg'), styles.onButton]}>{button.icon}</Text>}
    </Pressable>
  </View>;
}

/**
 * Home (UI-1, design: app_home_mode_selection): two clearly separated entry points,
 * Child Mode and the PIN-protected Parent Portal. Child Mode needs a child profile first.
 * `language` (else the shared parent language) picks English or Urdu, one language at a time (UI-8).
 */
export default function HomeScreen({ onChildMode, onParentPortal, childModeAvailable = true, language, onLanguageChange }) {
  const lang = useScreenLanguage(language);
  const { setLanguage } = useLanguage();
  const t = HOME_TEXT[lang];
  return <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content}>
      <LanguageToggle style={styles.toggle} language={lang} onChange={onLanguageChange || setLanguage} />

      <View style={styles.brand}>
        <View style={styles.brandIcon}><Text style={styles.brandIconText}>{'\u{1F5E3}︎'}</Text></View>
        <Line text={t.appName} variant="headlineMd" color={colors.text} lang={lang} centred />
        <View style={styles.tagline}>
          <Line text={t.tagline} variant="label" color={colors.textMuted} lang={lang} centred />
        </View>
      </View>

      <ModeCard
        testID="child-mode"
        title={t.childMode}
        icon={'\u{1F388}'}
        cardStyle={styles.childCard}
        iconStyle={styles.childIcon}
        titleColor={colors.onChildCard}
        button={{ label: t.start, icon: '▶' }}
        buttonColor={colors.clayDark}
        onPress={onChildMode}
        disabled={!childModeAvailable}
        lang={lang}
      />
      {!childModeAvailable && <Line text={t.needChild} variant="label" color={colors.textMuted} lang={lang} centred />}

      <ModeCard
        testID="parent-portal"
        title={t.parentPortal}
        icon={'\u{1F512}'}
        cardStyle={styles.parentCard}
        iconStyle={styles.parentIcon}
        titleColor={colors.text}
        button={{ label: t.open, icon: '\u{1F511}' }}
        buttonColor={colors.primaryLight}
        onPress={onParentPortal}
        lang={lang}
      />
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  titleBox: { flexShrink: 1 },
  centred: { textAlign: 'center' },
  toggle: { alignSelf: 'flex-end' },
  flip: { flexDirection: 'row-reverse' },
  brand: { alignItems: 'center', gap: spacing.sm },
  brandIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { fontSize: 22, color: colors.primary },
  tagline: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.input, backgroundColor: colors.field },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.input, ...shadows.raised },
  childCard: { backgroundColor: colors.childCard },
  parentCard: { backgroundColor: colors.parentCard },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  childIcon: { backgroundColor: colors.clayLight },
  parentIcon: { backgroundColor: colors.card, borderRadius: radius.input },
  cardIconText: { fontSize: 22 },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touch.field,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  onButton: { color: colors.onPrimary },
  pressed: { transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
});
