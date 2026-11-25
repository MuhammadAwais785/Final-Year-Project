import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import LanguageToggle from '../src/components/LanguageToggle';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';
import { touch } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

const mounted = [];
afterEach(async () => {
  await ReactTestRenderer.act(async () => mounted.splice(0).forEach((t) => t.unmount()));
});

function Connected() {
  const { language, setLanguage } = useLanguage();
  return <><LanguageToggle language={language} onChange={setLanguage} /><Text testID="current">{language}</Text></>;
}

async function mount(element) {
  let tree;
  await ReactTestRenderer.act(async () => { tree = ReactTestRenderer.create(element); });
  mounted.push(tree);
  return tree.root;
}

describe('LanguageToggle (UI-8)', () => {
  test('shows EN and اردو and marks the current one', async () => {
    const root = await mount(<LanguageToggle language="ur" onChange={() => {}} />);
    const labels = root.findAllByType(Text).map((t) => t.props.children);
    expect(labels).toEqual(['EN', 'اردو']);
    expect(root.findByProps({ testID: 'lang-ur' }).props.accessibilityState).toEqual({ selected: true });
    expect(root.findByProps({ testID: 'lang-en' }).props.accessibilityState).toEqual({ selected: false });
  });

  test('each option is at least the parent touch size', async () => {
    const root = await mount(<LanguageToggle language="en" onChange={() => {}} />);
    const style = [].concat(root.findByProps({ testID: 'lang-en' }).props.style).flat();
    expect(Object.assign({}, ...style)).toMatchObject({ minWidth: touch.parent, minHeight: touch.parent });
  });

  test('pressing an option reports it', async () => {
    const onChange = jest.fn();
    const root = await mount(<LanguageToggle language="en" onChange={onChange} />);
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'lang-ur' }).props.onPress());
    expect(onChange).toHaveBeenCalledWith('ur');
  });

  test('connected to the shared setting it switches the language', async () => {
    const root = await mount(<LanguageProvider><Connected /></LanguageProvider>);
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'lang-ur' }).props.onPress());
    expect(root.findByProps({ testID: 'current' }).props.children).toBe('ur');
    await ReactTestRenderer.act(async () => root.findByProps({ testID: 'lang-en' }).props.onPress());
    expect(root.findByProps({ testID: 'current' }).props.children).toBe('en');
  });
});
