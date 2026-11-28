import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../../components/ActionButton';
import ScreenHeader from '../../components/ScreenHeader';
import TextField from '../../components/TextField';
import { useScreenLanguage } from '../../context/LanguageContext';
import { colors, radius, shadows, spacing, textStyle } from '../../theme';
import { PIN } from '../../utils/constants';
import { isPinComplete } from './pinLock';

const RESET_PIN_TEXT = {
  en: {
    title: 'Reset Parent PIN',
    intro: 'Verify your account password to choose a new 4-digit PIN.',
    passwordLabel: 'Account password',
    passwordPlaceholder: 'Enter your login password',
    newPinLabel: 'New 4-digit PIN',
    newPinPlaceholder: 'e.g. 2468',
    confirmPinLabel: 'Confirm new PIN',
    confirmPinPlaceholder: 'Re-enter 4-digit PIN',
    submit: 'Update PIN',
    submitting: 'Updating…',
    errors: {
      passwordRequired: 'Please enter your account password.',
      pinInvalid: `PIN must be ${PIN.LENGTH} digits.`,
      pinMismatch: 'PINs do not match.',
    },
    apiErrors: {
      wrongPassword: 'Incorrect account password.',
      rateLimited: 'Too many attempts. Please wait a few minutes and try again.',
      network: 'Internet connection is required to reset your PIN.',
    },
  },
  ur: {
    title: 'والدین کا PIN ری سیٹ کریں',
    intro: 'نیا 4 ہندسوں کا PIN سیٹ کرنے کے لیے اپنا اکاؤنٹ پاس ورڈ درج کریں۔',
    passwordLabel: 'اکاؤنٹ پاس ورڈ',
    passwordPlaceholder: 'اپنا لاگ اِن پاس ورڈ درج کریں',
    newPinLabel: 'نیا 4 ہندسوں کا PIN',
    newPinPlaceholder: 'مثلاً 2468',
    confirmPinLabel: 'نئے PIN کی تصدیق',
    confirmPinPlaceholder: '4 ہندسوں کا PIN دوبارہ درج کریں',
    submit: 'PIN اپڈیٹ کریں',
    submitting: 'اپڈیٹ ہو رہا ہے…',
    errors: {
      passwordRequired: 'براہ کرم اپنا اکاؤنٹ پاس ورڈ درج کریں۔',
      pinInvalid: `PIN بالکل ${PIN.LENGTH} ہندسوں کا ہونا چاہیے۔`,
      pinMismatch: 'دونوں PIN آپس میں نہیں ملتے۔',
    },
    apiErrors: {
      wrongPassword: 'اکاؤنٹ پاس ورڈ غلط ہے۔',
      rateLimited: 'بہت زیادہ کوششیں ہو گئیں۔ چند منٹ بعد دوبارہ کوشش کریں۔',
      network: 'PIN ری سیٹ کرنے کے لیے انٹرنیٹ کنکشن ضروری ہے۔',
    },
  },
};

/**
 * Forgot-PIN reset screen (UC-23, BR-34). Requires guardian password before overwriting PIN.
 */
export default function ResetPinScreen({ store, onBack, onResetSuccess, language: languageProp }) {
  const lang = useScreenLanguage(languageProp);
  const t = RESET_PIN_TEXT[lang];
  const [password, setPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [saving, setSaving] = useState(false);
  const busyRef = useRef(false);

  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverError) setServerError(null);
  };

  const submit = async () => {
    if (busyRef.current) return;
    const nextErrors = {};
    if (!password) nextErrors.password = t.errors.passwordRequired;
    if (!isPinComplete(newPin)) nextErrors.newPin = t.errors.pinInvalid;
    if (confirmPin !== newPin) nextErrors.confirmPin = t.errors.pinMismatch;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setServerError(null);
      return;
    }

    busyRef.current = true;
    setSaving(true);
    setErrors({});
    setServerError(null);

    try {
      await store.resetWithPassword({ password, newPin });
      onResetSuccess?.();
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) setServerError(t.apiErrors.wrongPassword);
      else if (status === 429) setServerError(t.apiErrors.rateLimited);
      else setServerError(t.apiErrors.network);
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader title={t.title} onBack={onBack} language={lang} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[textStyle('body', lang), styles.intro]}>{t.intro}</Text>
        <View style={styles.card}>
          <TextField
            testID="reset-password"
            label={t.passwordLabel}
            placeholder={t.passwordPlaceholder}
            value={password}
            onChangeText={(v) => { setPassword(v); clearError('password'); }}
            error={errors.password}
            language={lang}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            testID="reset-new-pin"
            label={t.newPinLabel}
            placeholder={t.newPinPlaceholder}
            value={newPin}
            onChangeText={(v) => { setNewPin(v.replace(/\D/g, '').slice(0, PIN.LENGTH)); clearError('newPin'); }}
            error={errors.newPin}
            language={lang}
            keyboardType="number-pad"
            maxLength={PIN.LENGTH}
            secureTextEntry
          />
          <TextField
            testID="reset-confirm-pin"
            label={t.confirmPinLabel}
            placeholder={t.confirmPinPlaceholder}
            value={confirmPin}
            onChangeText={(v) => { setConfirmPin(v.replace(/\D/g, '').slice(0, PIN.LENGTH)); clearError('confirmPin'); }}
            error={errors.confirmPin}
            language={lang}
            keyboardType="number-pad"
            maxLength={PIN.LENGTH}
            secureTextEntry
          />

          {serverError && (
            <View testID="reset-error-banner" style={styles.banner} accessibilityLiveRegion="polite">
              <Text style={[textStyle('label', lang), styles.bannerText]}>{serverError}</Text>
            </View>
          )}

          <ActionButton
            testID="reset-pin-submit"
            title={saving ? t.submitting : t.submit}
            disabled={saving}
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
  intro: { color: colors.textMuted },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  banner: {
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.errorLight,
  },
  bannerText: { color: colors.error },
});
