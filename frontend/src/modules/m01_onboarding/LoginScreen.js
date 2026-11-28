import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LanguageToggle from '../../components/LanguageToggle';
import OptionPicker from '../../components/OptionPicker';
import ActionButton from '../../components/ActionButton';
import TextField from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { AUTH_TEXT } from './authText';
import { validateLogin, validateRegister } from './validateAuth';

function mapApiError(error, apiErrors) {
  const status = error?.response?.status;
  if (status === 401) return apiErrors.invalidCredentials;
  if (status === 409) return apiErrors.emailExists;
  if (status === 429) return apiErrors.rateLimited;
  if (status === 400 && error?.response?.data?.message) return error.response.data.message;
  return apiErrors.network;
}

/**
 * Guardian Login & Registration screen (DESIGN.md, UI-8).
 * Supports single-language English / Urdu switching and inline field validation.
 */
export default function LoginScreen({ language: languageProp }) {
  const lang = useScreenLanguage(languageProp);
  const { setLanguage } = useLanguage();
  const t = AUTH_TEXT[lang];
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const busyRef = useRef(false);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setServerError(null);
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  };

  const submit = async () => {
    if (busyRef.current) return;

    const isRegister = mode === 'register';
    const check = isRegister
      ? validateRegister({ name, email, password, confirmPassword }, lang)
      : validateLogin({ email, password }, lang);

    if (!check.ok) {
      setErrors(check.errors);
      setServerError(null);
      return;
    }

    busyRef.current = true;
    setSubmitting(true);
    setErrors({});
    setServerError(null);

    try {
      if (isRegister) {
        await register({ ...check.value, language: lang });
      } else {
        await login(check.value);
      }
    } catch (error) {
      setServerError(mapApiError(error, t.apiErrors));
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  };

  const isRegister = mode === 'register';
  const rtl = lang === 'ur';
  const submitLabel = isRegister
    ? (submitting ? t.creatingAccount : t.createAccount)
    : (submitting ? t.signingIn : t.signIn);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LanguageToggle style={styles.toggle} language={lang} onChange={setLanguage} />

        <View style={styles.brand}>
          <View style={styles.brandIcon}><Text style={styles.brandIconText}>{'\u{1F5E3}︎'}</Text></View>
          <Text accessibilityRole="header" style={[textStyle('headlineMd', lang), styles.title]}>{t.appName}</Text>
          <Text style={[textStyle('body', lang), styles.subtitle]}>{t.subtitle}</Text>
        </View>

        <OptionPicker
          options={[
            { label: t.modes.login, value: 'login' },
            { label: t.modes.register, value: 'register' },
          ]}
          value={mode}
          onChange={switchMode}
          language={lang}
        />

        <View style={styles.card}>
          {isRegister && (
            <TextField
              testID="auth-name"
              label={t.nameLabel}
              placeholder={t.namePlaceholder}
              value={name}
              onChangeText={(v) => { setName(v); clearFieldError('name'); }}
              error={errors.name}
              language={lang}
              autoCapitalize="words"
            />
          )}

          <TextField
            testID="auth-email"
            label={t.emailLabel}
            placeholder={t.emailPlaceholder}
            value={email}
            onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
            error={errors.email}
            language={lang}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <View>
            <TextField
              testID="auth-password"
              label={t.passwordLabel}
              placeholder={t.passwordPlaceholder}
              value={password}
              onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
              error={errors.password}
              language={lang}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              testID="toggle-password"
              onPress={() => setShowPassword((s) => !s)}
              accessibilityRole="button"
              style={[styles.showToggle, rtl && styles.showToggleRtl]}>
              <Text style={[textStyle('label', lang), styles.link]}>
                {showPassword ? t.hide : t.show}
              </Text>
            </Pressable>
          </View>

          {isRegister && (
            <TextField
              testID="auth-confirm-password"
              label={t.confirmPasswordLabel}
              placeholder={t.confirmPasswordPlaceholder}
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); clearFieldError('confirmPassword'); }}
              error={errors.confirmPassword}
              language={lang}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          )}

          {serverError && (
            <View testID="auth-error-banner" style={styles.banner} accessibilityLiveRegion="polite">
              <Text style={[textStyle('label', lang), styles.bannerText]}>{serverError}</Text>
            </View>
          )}

          <ActionButton
            testID="auth-submit"
            title={submitLabel}
            disabled={submitting}
            onPress={submit}
            language={lang}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.parentBackground },
  content: { padding: spacing.screen, gap: spacing.lg },
  toggle: { alignSelf: 'flex-end' },
  brand: { alignItems: 'center', gap: spacing.xs },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: { fontSize: 22, color: colors.primary },
  title: { color: colors.text, textAlign: 'center' },
  subtitle: { color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  showToggle: { alignSelf: 'flex-end', marginTop: spacing.xs, paddingVertical: spacing.xs },
  showToggleRtl: { alignSelf: 'flex-start' },
  link: { color: colors.primary },
  banner: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.errorLight,
  },
  bannerText: { color: colors.error },
});
