import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HomeScreen from '../src/modules/m01_onboarding/HomeScreen';

function render(props = {}) {
  let tree;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<HomeScreen {...props} />);
  });
  const root = tree.root;
  const press = (testID) => ReactTestRenderer.act(() => root.findByProps({ testID }).props.onPress());
  const texts = () => root.findAllByType(Text).map((t) => [].concat(t.props.children).join(''));
  return { root, press, texts };
}

describe('HomeScreen (UI-1)', () => {
  test('shows both entry points in English and Urdu', () => {
    const { texts } = render();
    ['Child Mode', 'بچوں کا موڈ', 'Parent Portal', 'والدین کا پورٹل', 'Silent Screen', 'سائلنٹ اسکرین سنڈروم']
      .forEach((t) => expect(texts()).toContain(t));
  });

  test('Start opens Child Mode and Open opens the Parent Portal', () => {
    const onChildMode = jest.fn();
    const onParentPortal = jest.fn();
    const { press } = render({ onChildMode, onParentPortal });
    press('child-mode');
    press('parent-portal');
    expect(onChildMode).toHaveBeenCalledTimes(1);
    expect(onParentPortal).toHaveBeenCalledTimes(1);
  });

  test('Child Mode is disabled with a hint until a child profile exists', () => {
    const { root, texts } = render({ childModeAvailable: false });
    expect(root.findByProps({ testID: 'child-mode' }).props.disabled).toBe(true);
    expect(texts()).toContain('Add a child in the Parent Portal first.');
    expect(root.findByProps({ testID: 'parent-portal' }).props.disabled).toBeFalsy();
  });

  test('the language toggle marks the current language and reports a change', () => {
    const onLanguageChange = jest.fn();
    const { root, press } = render({ language: 'en', onLanguageChange });
    expect(root.findByProps({ testID: 'lang-en' }).props.accessibilityState).toEqual({ selected: true });
    expect(root.findByProps({ testID: 'lang-ur' }).props.accessibilityState).toEqual({ selected: false });
    press('lang-ur');
    expect(onLanguageChange).toHaveBeenCalledWith('ur');
  });
});
