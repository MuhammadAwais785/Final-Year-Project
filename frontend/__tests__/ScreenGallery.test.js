import React from 'react';
import { AccessibilityInfo } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ScreenGallery, { SCREENS } from '../src/dev/ScreenGallery';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

beforeEach(() => jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false));
afterEach(() => jest.restoreAllMocks());

// Smoke test: every screen opens from the gallery without crashing.
test.each(SCREENS.map((s) => [s.id]))('opens the %s screen', async (id) => {
  let tree;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<ScreenGallery />);
  });
  await ReactTestRenderer.act(async () => tree.root.findByProps({ testID: `open-${id}` }).props.onPress());
  expect(tree.root.findAllByProps({ testID: `open-${id}` })).toHaveLength(0);
  await ReactTestRenderer.act(async () => tree.unmount());
});
