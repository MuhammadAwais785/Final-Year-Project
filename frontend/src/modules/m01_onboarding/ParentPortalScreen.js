import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import LanguageToggle from '../../components/LanguageToggle';
import OptionPicker from '../../components/OptionPicker';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useChildProfile } from '../../context/ChildProfileContext';
import { useLanguage, useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';

const PORTAL_TEXT = {
  en: {
    title: 'Parent Portal',
    greeting: (name) => (name ? `Welcome, ${name}` : 'Welcome'),
    activeChild: 'Active Child Profile',
    noChild: 'No child profile yet. Add one to begin.',
    dashboard: 'Progress Dashboard',
    reports: 'Weekly Reports',
    addChild: 'Add a Child',
    consent: 'Consent & Permissions',
    baseline: 'Baseline Screening',
    goals: 'Learning Goals',
    logout: 'Log Out',
  },
  ur: {
    title: 'والدین پورٹل',
    greeting: (name) => (name ? `خوش آمدید، ${name}` : 'خوش آمدید'),
    activeChild: 'منتخب بچے کا پروفائل',
    noChild: 'ابھی کوئی بچے کا پروفائل نہیں ہے۔ شروع کرنے کے لیے شامل کریں۔',
    dashboard: 'پیش رفت ڈیش بورڈ',
    reports: 'ہفتہ وار رپورٹس',
    addChild: 'بچہ شامل کریں',
    consent: 'اجازت نامہ اور پرائیویسی',
    baseline: 'ابتدائی اسکریننگ',
    goals: 'سیکھنے کے اہداف',
    logout: 'لاگ آؤٹ',
  },
};

/**
 * Parent Portal hub (UI-8, BR-19). Reached after Parent PIN verification.
 */
export default function ParentPortalScreen({ onBack, onNavigate, language: languageProp }) {
  const language = useScreenLanguage(languageProp);
  const { setLanguage } = useLanguage();
  const t = PORTAL_TEXT[language];
  const { guardian, profiles, logout } = useAuth();
  const { child, setChild, clearChildren } = useChildProfile();

  const childOptions = (profiles || []).map((p) => ({
    label: `${p.name} (${p.age})`,
    value: p._id,
    language: p.language,
  }));

  const handleLogout = () => {
    clearChildren();
    logout();
  };

  return <SafeAreaView style={styles.screen}>
    <ScreenHeader
      title={t.title}
      onBack={onBack}
      language={language}
      right={<LanguageToggle language={language} onChange={setLanguage} />}
    />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={[textStyle('headlineMd', language), styles.greeting]}>{t.greeting(guardian?.name)}</Text>

      <View style={styles.card}>
        {childOptions.length > 0 ? (
          <OptionPicker
            label={t.activeChild}
            options={childOptions}
            value={child?._id}
            onChange={(id) => {
              const picked = profiles.find((p) => p._id === id);
              if (picked) setChild(picked);
            }}
            language={language}
            wrap
          />
        ) : (
          <Text style={[textStyle('body', language), styles.muted]}>{t.noChild}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <ActionButton testID="nav-dashboard" title={t.dashboard} language={language} disabled={!child} onPress={() => onNavigate('Dashboard')} />
        <ActionButton testID="nav-reports" title={t.reports} variant="secondary" language={language} disabled={!child} onPress={() => onNavigate('Reports')} />
        <ActionButton testID="nav-add-child" title={t.addChild} variant="secondary" language={language} onPress={() => onNavigate('ChildProfile')} />
        <ActionButton testID="nav-consent" title={t.consent} variant="secondary" language={language} disabled={!child} onPress={() => onNavigate('Consent')} />
        <ActionButton testID="nav-baseline" title={t.baseline} variant="secondary" language={language} disabled={!child} onPress={() => onNavigate('Baseline')} />
        <ActionButton testID="nav-goals" title={t.goals} variant="secondary" language={language} disabled={!child} onPress={() => onNavigate('Goals')} />
        <ActionButton testID="nav-logout" title={t.logout} variant="tertiary" language={language} onPress={handleLogout} />
      </View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  greeting: { color: colors.text },
  card: { padding: spacing.lg, borderRadius: radius.card, backgroundColor: colors.card, ...shadows.card },
  muted: { color: colors.textMuted },
  actions: { gap: spacing.sm },
});
