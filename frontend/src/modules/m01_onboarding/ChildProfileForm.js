import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import OptionPicker from '../../components/OptionPicker';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import { CHILD_AGE, CHILD_NAME_MAX_LENGTH, LANGUAGES } from '../../utils/constants';
import { validateChildProfile } from './validateChildProfile';

const AGE_OPTIONS = Array.from({ length: CHILD_AGE.MAX - CHILD_AGE.MIN + 1 }, (_, i) => {
  const age = CHILD_AGE.MIN + i;
  return { label: String(age), value: age };
});
const LANGUAGE_OPTIONS = [
  { label: 'English', value: LANGUAGES.ENGLISH },
  { label: 'اردو', value: LANGUAGES.URDU },
];

/** UI-02 / FR-1: child name, age (3–7) and one language. Calls onSubmit with the validated profile. */
export default function ChildProfileForm({ onSubmit, submitTitle = 'Save profile' }) {
  const [form, setForm] = useState({ name: '', age: null, language: null });
  const [errors, setErrors] = useState({});

  const update = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = () => {
    const result = validateChildProfile(form);
    if (result.ok) onSubmit(result.value);
    else setErrors(result.errors);
  };

  return <View style={styles.form}>
    <TextField testID="child-name" label="Child's name" placeholder="e.g. Ali" value={form.name}
      onChangeText={update('name')} maxLength={CHILD_NAME_MAX_LENGTH} error={errors.name} />
    <OptionPicker label="Age" options={AGE_OPTIONS} value={form.age} onChange={update('age')} error={errors.age} />
    <OptionPicker label="Language" options={LANGUAGE_OPTIONS} value={form.language} onChange={update('language')} error={errors.language} />
    <PrimaryButton title={submitTitle} onPress={submit} />
  </View>;
}
const styles = StyleSheet.create({ form: { gap: 16 } });
