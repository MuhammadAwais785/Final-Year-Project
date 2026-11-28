jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
  removeItem: jest.fn(async () => {}),
}));

jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    enableScreens: jest.fn(),
    screensEnabled: jest.fn(() => false),
    compatibilityFlags: {
      usesNewAndroidHeaderHeightImplementation: true,
    },
    featureFlags: {
      experiment: {},
    },
    Screen: ({ children, ...props }) => React.createElement(View, props, children),
    ScreenContainer: ({ children, ...props }) => React.createElement(View, props, children),
    ScreenStack: ({ children, ...props }) => React.createElement(View, props, children),
    ScreenStackItem: ({ children, ...props }) => React.createElement(View, props, children),
    ScreenStackHeaderConfig: () => null,
    ScreenStackHeaderSubview: () => null,
    ScreenStackHeaderBackButtonImage: () => null,
    ScreenStackHeaderCenterView: () => null,
    ScreenStackHeaderLeftView: () => null,
    ScreenStackHeaderRightView: () => null,
    ScreenStackHeaderSearchBarView: () => null,
    NativeScreen: View,
    NativeScreenContainer: View,
    FullWindowOverlay: View,
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, left: 0, right: 0, bottom: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const SafeAreaInsetsContext = React.createContext(insets);
  const SafeAreaFrameContext = React.createContext(frame);
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(
        SafeAreaFrameContext.Provider,
        { value: frame },
        React.createElement(SafeAreaInsetsContext.Provider, { value: insets }, children),
      ),
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    SafeAreaInsetsContext,
    SafeAreaFrameContext,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});
