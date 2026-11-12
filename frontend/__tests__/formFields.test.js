import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import OptionPicker from '../src/components/OptionPicker';
import TextField from '../src/components/TextField';
import { colors } from '../src/theme';

function render(element) {
  let tree;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element);
  });
  return tree.root;
}

const flat = (node) => StyleSheet.flatten(node.props.style);
const textNodes = (root) => root.findAllByType(Text);
const findText = (root, value) => textNodes(root).find((t) => [].concat(t.props.children).join('') === value);

describe('TextField', () => {
  test('shows the label and no error by default', () => {
    const root = render(<TextField label="Child's name" value="" onChangeText={() => {}} />);
    expect(findText(root, "Child's name")).toBeDefined();
    expect(textNodes(root)).toHaveLength(1);
    expect(flat(root.findByType(TextInput)).borderColor).toBe(colors.border);
  });

  test('shows the error in the error colour and colours the border', () => {
    const root = render(<TextField label="Name" error="Please enter the name." />);
    expect(flat(findText(root, 'Please enter the name.')).color).toBe(colors.error);
    expect(flat(root.findByType(TextInput)).borderColor).toBe(colors.error);
  });

  test('uses the Urdu font and right-to-left text in Urdu', () => {
    const root = render(<TextField label="بچے کا نام" language="ur" />);
    const input = flat(root.findByType(TextInput));
    expect(input.fontFamily).toBe('NotoNastaliqUrdu-Regular');
    expect(input.writingDirection).toBe('rtl');
  });

  test('passes input props through and labels the input for screen readers', () => {
    const onChangeText = jest.fn();
    const root = render(<TextField label="Name" onChangeText={onChangeText} maxLength={30} />);
    const input = root.findByType(TextInput);
    expect(input.props.accessibilityLabel).toBe('Name');
    expect(input.props.maxLength).toBe(30);
    ReactTestRenderer.act(() => input.props.onChangeText('Ali'));
    expect(onChangeText).toHaveBeenCalledWith('Ali');
  });
});

describe('OptionPicker', () => {
  const options = [
    { label: 'English', value: 'en' },
    { label: 'اردو', value: 'ur', language: 'ur' },
  ];

  test('marks only the selected option as selected', () => {
    const root = render(<OptionPicker label="Language" options={options} value="ur" onChange={() => {}} />);
    expect(root.findByProps({ testID: 'option-ur' }).props.accessibilityState).toEqual({ selected: true });
    expect(root.findByProps({ testID: 'option-en' }).props.accessibilityState).toEqual({ selected: false });
  });

  test('calls onChange with the tapped value', () => {
    const onChange = jest.fn();
    const root = render(<OptionPicker options={options} value={null} onChange={onChange} />);
    ReactTestRenderer.act(() => root.findByProps({ testID: 'option-en' }).props.onPress());
    expect(onChange).toHaveBeenCalledWith('en');
  });

  test('renders an option in its own language font', () => {
    const root = render(<OptionPicker options={options} value={null} onChange={() => {}} />);
    expect(flat(findText(root, 'اردو')).fontFamily).toBe('NotoNastaliqUrdu-Regular');
    expect(flat(findText(root, 'English')).fontFamily).toBe('PlusJakartaSans-Regular');
  });

  test('runs chips right to left in Urdu', () => {
    const root = render(<OptionPicker options={options} value={null} onChange={() => {}} language="ur" />);
    const row = root.findAllByType(View).find((v) => flat(v)?.flexWrap === 'wrap');
    expect(flat(row).flexDirection).toBe('row-reverse');
  });

  test('shows an error message when given', () => {
    const root = render(<OptionPicker options={options} value={null} onChange={() => {}} error="Choose English or Urdu." />);
    expect(flat(findText(root, 'Choose English or Urdu.')).color).toBe(colors.error);
  });
});
