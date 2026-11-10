import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import PrimaryButton from '../src/components/PrimaryButton';
import ChildProfileForm from '../src/modules/m01_onboarding/ChildProfileForm';

function render(onSubmit) {
  let tree;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<ChildProfileForm onSubmit={onSubmit} />);
  });
  const root = tree.root;
  const press = (testID) => ReactTestRenderer.act(() => root.findByProps({ testID }).props.onPress());
  const typeName = (text) => ReactTestRenderer.act(() => root.findByProps({ testID: 'child-name' }).props.onChangeText(text));
  const save = () => ReactTestRenderer.act(() => root.findByType(PrimaryButton).props.onPress());
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { press, typeName, save, texts };
}

describe('ChildProfileForm (FR-1)', () => {
  test('shows an error for each missing field and does not submit', () => {
    const onSubmit = jest.fn();
    const form = render(onSubmit);
    form.save();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.texts()).toEqual(expect.arrayContaining([
      "Please enter the child's name.",
      'Choose an age from 3 to 7.',
      'Choose English or Urdu.',
    ]));
  });

  test('submits the validated profile', () => {
    const onSubmit = jest.fn();
    const form = render(onSubmit);
    form.typeName('  Sara ');
    form.press('option-5');
    form.press('option-ur');
    form.save();
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Sara', age: 5, language: 'ur' });
  });

  test('clears a field error once the field is corrected', () => {
    const form = render(jest.fn());
    form.save();
    form.press('option-4');
    expect(form.texts()).not.toContain('Choose an age from 3 to 7.');
  });
});
