import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OptionPicker from '../../components/OptionPicker';
import SubmitButton from '../../components/SubmitButton';
import TextField from '../../components/TextField';
import { useScreenLanguage } from '../../context/LanguageContext';
import { CHILD_AGE, CHILD_NAME_MAX_LENGTH, LANGUAGES } from '../../utils/constants';
import { CHILD_PROFILE_TEXT } from './childProfileText';
import { validateChildProfile } from './validateChildProfile';

const AGE_OPTIONS = Array.from({ length: CHILD_AGE.MAX - CHILD_AGE.MIN + 1 }, (_, i) => {
  const age = CHILD_AGE.MIN + i;
  return { label: String(age), value: age };
});
const LANGUAGE_OPTIONS = [
  { label: 'English', value: LANGUAGES.ENGLISH, language: LANGUAGES.ENGLISH },
  { label: 'اردو', value: LANGUAGES.URDU, language: LANGUAGES.URDU },
];

/** UI-02 / FR-1: child name, age (3–7) and one language. Calls onSubmit with the validated profile. */
export default function ChildProfileForm({ onSubmit, submitTitle, language }) {
  const lang = useScreenLanguage(language);
  const t = CHILD_PROFILE_TEXT[lang];
  const [form, setForm] = useState({ name: '', age: null, language: null });
  const [errors, setErrors] = useState({});

  const update = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = validateChildProfile(form, lang);
    if (result.ok) onSubmit(result.value);
    else setErrors(result.errors);
  };

  return <View style={styles.form}>
    <TextField testID="child-name" label={t.name} placeholder={t.namePlaceholder} value={form.name} language={lang}
      onChangeText={update('name')} maxLength={CHILD_NAME_MAX_LENGTH} error={errors.name} />
    <OptionPicker label={t.age} options={AGE_OPTIONS} value={form.age} onChange={update('age')} error={errors.age} language={lang} />
    <OptionPicker label={t.language} options={LANGUAGE_OPTIONS} value={form.language} onChange={update('language')} error={errors.language} language={lang} />
    <SubmitButton language={lang} title={submitTitle || t.save} onPress={submit} />
  </View>;
}
const styles = StyleSheet.create({ form: { gap: 16 } });
