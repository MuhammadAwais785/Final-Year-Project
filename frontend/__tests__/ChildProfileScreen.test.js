import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { createProfile } from '../src/api/profiles';
import PrimaryButton from '../src/components/PrimaryButton';
import ScreenHeader from '../src/components/ScreenHeader';
import { ChildProfileProvider, useChildProfile } from '../src/context/ChildProfileContext';
import ChildProfileScreen from '../src/modules/m01_onboarding/ChildProfileScreen';

jest.mock('../src/api/profiles', () => ({ createProfile: jest.fn() }));

const SAVED = { _id: 'c1', name: 'Sara', age: 5, language: 'ur' };

function render(props = {}) {
  let activeChild;
  function ActiveChild() {
    activeChild = useChildProfile().child;
    return null;
  }
  let tree;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ChildProfileProvider>
        <ChildProfileScreen {...props} />
        <ActiveChild />
      </ChildProfileProvider>,
    );
  });
  const root = tree.root;
  const fillValidForm = () => ReactTestRenderer.act(() => {
    root.findByProps({ testID: 'child-name' }).props.onChangeText('Sara');
    root.findByProps({ testID: 'option-5' }).props.onPress();
    root.findByProps({ testID: 'option-ur' }).props.onPress();
  });
  const button = () => root.findByType(PrimaryButton);
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { root, fillValidForm, button, texts, getActiveChild: () => activeChild };
}

beforeEach(() => createProfile.mockReset());

describe('ChildProfileScreen (FR-1)', () => {
  test('shows the design title, intro card and save button', () => {
    const { root, texts, button } = render();
    expect(root.findByType(ScreenHeader).props.title).toBe('Add a child');
    expect(texts()).toContain('New Profile Setup');
    expect(button().props.title).toBe('Save profile');
  });

  test('does not call the server when the form is invalid', async () => {
    const { button } = render();
    await ReactTestRenderer.act(async () => button().props.onPress());
    expect(createProfile).not.toHaveBeenCalled();
  });

  test('saves the profile, makes it the active child and calls onSaved', async () => {
    createProfile.mockResolvedValue({ data: SAVED });
    const onSaved = jest.fn();
    const { fillValidForm, button, getActiveChild } = render({ onSaved });
    fillValidForm();
    await ReactTestRenderer.act(async () => button().props.onPress());
    expect(createProfile).toHaveBeenCalledWith({ name: 'Sara', age: 5, language: 'ur' });
    expect(onSaved).toHaveBeenCalledWith(SAVED);
    expect(getActiveChild()).toEqual(SAVED);
  });

  test('shows "Saving…" while waiting and ignores a second tap', async () => {
    let finish;
    createProfile.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { fillValidForm, button } = render();
    fillValidForm();
    await ReactTestRenderer.act(async () => {
      button().props.onPress();
      button().props.onPress();
    });
    expect(button().props.title).toBe('Saving…');
    expect(createProfile).toHaveBeenCalledTimes(1);
    await ReactTestRenderer.act(async () => finish({ data: SAVED }));
    expect(button().props.title).toBe('Save profile');
  });

  test('shows a friendly message when the save fails, and allows trying again', async () => {
    createProfile.mockRejectedValueOnce(new Error('Network Error'));
    const onSaved = jest.fn();
    const { fillValidForm, button, texts } = render({ onSaved });
    fillValidForm();
    await ReactTestRenderer.act(async () => button().props.onPress());
    expect(texts()).toContain('Could not save the profile. Check your internet and try again.');
    expect(onSaved).not.toHaveBeenCalled();

    createProfile.mockResolvedValueOnce({ data: SAVED });
    await ReactTestRenderer.act(async () => button().props.onPress());
    expect(onSaved).toHaveBeenCalledWith(SAVED);
    expect(texts()).not.toContain('Could not save the profile. Check your internet and try again.');
  });

  test('asks the guardian to log in again when the session has ended (401)', async () => {
    createProfile.mockRejectedValue({ response: { status: 401 } });
    const { fillValidForm, button, texts } = render();
    fillValidForm();
    await ReactTestRenderer.act(async () => button().props.onPress());
    expect(texts()).toContain('Your session has ended. Please log in again.');
  });

  test('back button calls onBack', () => {
    const onBack = jest.fn();
    const { root } = render({ onBack });
    ReactTestRenderer.act(() => root.findByProps({ accessibilityLabel: 'Back' }).props.onPress());
    expect(onBack).toHaveBeenCalled();
  });
});
