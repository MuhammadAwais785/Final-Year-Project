import React from 'react';
import { StyleSheet, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ActionButton from '../src/components/ActionButton';
import OptionPicker from '../src/components/OptionPicker';
import SpeechBubble from '../src/components/SpeechBubble';
import GoalCard from '../src/modules/m01_onboarding/GoalCard';
import HomeScreen from '../src/modules/m01_onboarding/HomeScreen';
import { GOAL_TYPES, SKILLS } from '../src/modules/m01_onboarding/goals';
import { URDU_GLYPH_PAD } from '../src/theme';

function render(element) {
  let tree;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(element);
  });
  return tree.root;
}
const flat = (node) => StyleSheet.flatten(node.props.style);

// Android clips the last Urdu word when the Text box is narrower than the shaped glyphs.
describe('Urdu text fits on a real device', () => {
  test('ActionButton Urdu text is padded, can wrap and has no line limit', () => {
    const text = render(<ActionButton title="آئیں سانس لیتے ہیں" variant="calm" language="ur" />).findByType(Text);
    expect(flat(text).paddingHorizontal).toBe(URDU_GLYPH_PAD);
    expect(flat(text).height).toBeUndefined();
    expect(text.props.numberOfLines).toBeUndefined();
  });

  test('SpeechBubble Urdu text is padded, shrinks to wrap and has no fixed height', () => {
    const text = render(<SpeechBubble text="آئیں تھوڑا آرام کرتے ہیں" language="ur" />).findAllByType(Text)[0];
    expect(flat(text).paddingHorizontal).toBe(URDU_GLYPH_PAD);
    expect(flat(text).flexShrink).toBe(1);
    expect(flat(text).height).toBeUndefined();
    expect(text.props.numberOfLines).toBeUndefined();
  });

  test('English button text gets no extra padding', () => {
    const text = render(<ActionButton title="Start" />).findByType(Text);
    expect(flat(text).paddingHorizontal).toBeUndefined();
  });
});

describe('OptionPicker wrap mode', () => {
  const options = ['Objects', 'Animals', 'Colours', 'Actions'].map((label) => ({ label, value: label }));

  test('default stays one row of equal chips', () => {
    const root = render(<OptionPicker options={options} value={null} onChange={() => {}} />);
    const row = root.findByProps({ testID: 'option-Objects' }).parent;
    expect(flat(row).flexWrap).toBeUndefined();
    expect(flat(root.findByProps({ testID: 'option-Objects' })).flex).toBe(1);
  });

  test('wrap mode wraps with a basis that gives two per row, and keeps the touch size', () => {
    const root = render(<OptionPicker wrap options={options} value={null} onChange={() => {}} />);
    const chip = root.findByProps({ testID: 'option-Objects' });
    expect(flat(chip.parent).flexWrap).toBe('wrap');
    expect(flat(chip).flexBasis).toBe('45%');
    expect(flat(chip).flex).toBeUndefined();
    expect(flat(chip).minHeight).toBeGreaterThanOrEqual(48);
  });

  test('wrap mode keeps right-to-left in Urdu', () => {
    const root = render(<OptionPicker wrap language="ur" options={options} value={null} onChange={() => {}} />);
    expect(flat(root.findByProps({ testID: 'option-Objects' }).parent).flexDirection).toBe('row-reverse');
  });
});

describe('Home card title can shrink beside its icon', () => {
  test('Urdu title wrapper shrinks inside the right-to-left card row, so the last word is not pushed off the card', () => {
    const root = render(<HomeScreen language="ur" />);
    const title = root.findAllByType(Text).find((t) => t.props.children === 'بچوں کا موڈ');
    const up = (node, test) => (test(node) ? node : up(node.parent, test));
    const wrapper = up(title.parent, (n) => n.props.style && flat(n).flexShrink !== undefined);
    const row = up(wrapper.parent, (n) => n.props.style && flat(n).flexDirection !== undefined);
    expect(flat(wrapper).flexShrink).toBe(1);
    expect(flat(row).flexDirection).toBe('row-reverse');
    expect(flat(title).paddingHorizontal).toBe(URDU_GLYPH_PAD);
  });
});

describe('Goal skill chips', () => {
  const goal = { id: 'g1', type: GOAL_TYPES.SKILL, skill: SKILLS[0] };

  test('use wrap mode in English and Urdu, one chip per skill, each a full touch target', () => {
    ['en', 'ur'].forEach((language) => {
      const root = render(<GoalCard goal={goal} index={0} language={language} onChange={() => {}} onRemove={() => {}} />);
      const chips = root.findAll((n) => n.props.accessibilityRole === 'radio' && typeof n.type !== 'string');
      const unique = [...new Set(chips.map((c) => c.props.accessibilityLabel))];
      expect(unique).toHaveLength(SKILLS.length);
      root.findAll((n) => n.props.accessibilityRole === 'radio' && n.props.style && flat(n).flexBasis)
        .forEach((c) => expect(flat(c).minHeight).toBeGreaterThanOrEqual(48));
      const row = root.findAll((n) => n.props.style && flat(n) && flat(n).flexWrap === 'wrap');
      expect(row.length).toBeGreaterThan(0);
      expect(flat(row[0]).flexDirection).toBe(language === 'ur' ? 'row-reverse' : 'row');
    });
  });

  test('picking a wrapped chip reports the skill once and marks it selected', () => {
    const onChange = jest.fn();
    const options = SKILLS.map((s) => ({ label: s, value: s }));
    let tree;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(<OptionPicker wrap options={options} value={null} onChange={onChange} />);
    });
    ReactTestRenderer.act(() => tree.root.findByProps({ testID: `option-${SKILLS[2]}` }).props.onPress());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(SKILLS[2]);
    ReactTestRenderer.act(() => tree.update(<OptionPicker wrap options={options} value={SKILLS[2]} onChange={onChange} />));
    expect(tree.root.findByProps({ testID: `option-${SKILLS[2]}` }).props.accessibilityState).toEqual({ selected: true });
  });
});
