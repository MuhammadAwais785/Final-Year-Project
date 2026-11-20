import fs from 'fs';
import path from 'path';
import React from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import SpeechBubble from '../src/components/SpeechBubble';
import DoctorAvatar, { DOCTOR_ASPECT } from '../src/modules/m02_avatar/DoctorAvatar';

const flat = (node) => StyleSheet.flatten(node.props.style);

async function render(element) {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(element);
  });
  return tree;
}

describe('DoctorAvatar (M-02, FR-4)', () => {
  let loopStart;
  beforeEach(() => {
    loopStart = jest.fn();
    jest.spyOn(Animated, 'loop').mockReturnValue({ start: loopStart, stop: jest.fn() });
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });
  afterEach(() => jest.restoreAllMocks());

  test('shows the Doctor at the requested height, keeping his shape, with an accessible label', async () => {
    const tree = await render(<DoctorAvatar size={200} />);
    const image = tree.root.findByProps({ accessibilityRole: 'image' });
    expect(flat(image)).toMatchObject({ width: Math.round(200 * DOCTOR_ASPECT), height: 200 });
    expect(image.props.accessibilityLabel).toBe('Doctor');
  });

  test('DOCTOR_ASPECT matches the real doctor.png, which has a transparent background', () => {
    const png = fs.readFileSync(path.join(__dirname, '../src/assets/images/doctor.png'));
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const colourType = png[25]; // 6 = RGBA, so the background can be transparent
    expect(DOCTOR_ASPECT).toBeCloseTo(width / height, 5);
    expect(colourType).toBe(6);
  });

  test('labels the Doctor in Urdu on Urdu screens', async () => {
    const tree = await render(<DoctorAvatar language="ur" />);
    expect(tree.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe('ڈاکٹر');
  });

  test('stays still when not speaking', async () => {
    await render(<DoctorAvatar />);
    expect(loopStart).not.toHaveBeenCalled();
  });

  test('bounces while speaking', async () => {
    await render(<DoctorAvatar speaking />);
    expect(loopStart).toHaveBeenCalled();
  });

  test('does not move when the phone asks to reduce motion', async () => {
    AccessibilityInfo.isReduceMotionEnabled.mockResolvedValue(true);
    const tree = await render(<DoctorAvatar />);
    await ReactTestRenderer.act(async () => tree.update(<DoctorAvatar speaking />));
    expect(loopStart).not.toHaveBeenCalled();
  });
});

describe('SpeechBubble', () => {
  const tailOf = (tree) => tree.root.findAllByType(View).find((v) => flat(v)?.transform);

  test('shows the line in the English font with the tail at the bottom by default', async () => {
    const tree = await render(<SpeechBubble text="Hello Ali! Let's play!" />);
    const text = tree.root.findByType(Text);
    expect(text.props.children).toBe("Hello Ali! Let's play!");
    expect(flat(text).fontFamily).toBe('PlusJakartaSans-SemiBold');
    expect(flat(tailOf(tree)).bottom).toBeDefined();
  });

  test('side tail points left in English and right in Urdu', async () => {
    const en = await render(<SpeechBubble text="What is this?" tail="side" />);
    expect(flat(tailOf(en)).left).toBeDefined();
    const ur = await render(<SpeechBubble text="یہ کیا ہے؟" tail="side" language="ur" />);
    expect(flat(tailOf(ur)).right).toBeDefined();
    expect(flat(ur.root.findByType(Text)).writingDirection).toBe('rtl');
  });

  test('shows a replay button only when onReplay is given, and calls it', async () => {
    const plain = await render(<SpeechBubble text="Great job!" />);
    expect(plain.root.findAllByType(Pressable)).toHaveLength(0);

    const onReplay = jest.fn();
    const tree = await render(<SpeechBubble text="Great job!" onReplay={onReplay} />);
    const button = tree.root.findByProps({ accessibilityLabel: 'Hear it again' });
    ReactTestRenderer.act(() => button.props.onPress());
    expect(onReplay).toHaveBeenCalled();
  });
});
