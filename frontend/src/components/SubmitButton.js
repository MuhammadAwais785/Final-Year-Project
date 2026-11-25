import React from 'react';
import ActionButton from './ActionButton';
import PrimaryButton from './PrimaryButton';

/**
 * Main form button. English keeps the shared PrimaryButton unchanged; Urdu needs the Nastaliq font,
 * which PrimaryButton cannot set yet, so it uses ActionButton (UI-8). Merge once PrimaryButton takes a language.
 */
export default function SubmitButton({ title, onPress, language = 'en', testID }) {
  return language === 'ur'
    ? <ActionButton testID={testID} language="ur" title={title} onPress={onPress} />
    : <PrimaryButton title={title} onPress={onPress} />;
}
