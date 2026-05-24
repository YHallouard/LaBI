// Jest setup for React Native testing

// Setup React Native Gesture Handler for testing
require('react-native-gesture-handler/jestSetup');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};
  
  return Reanimated;
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
}));

// Mock expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-sqlite', () => ({
  openDatabase: jest.fn(() => ({
    transaction: jest.fn(),
    readTransaction: jest.fn(),
  })),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://test/',
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: 'NavigationContainer',
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  createStaticNavigation: jest.fn(),
  createNavigatorFactory: jest.fn(() => () => ({ Navigator: 'Navigator', Screen: 'Screen' })),
  useLinkBuilder: () => ({
    buildHref: jest.fn(() => '/mock-href'),
  }),
  useTheme: () => ({
    dark: false,
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#000000',
      border: '#E1E1E1',
      notification: '#FF3B30',
    },
  }),
}));

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: jest.fn(() => ({ Navigator: 'Navigator', Screen: 'Screen' })),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ setOptions: jest.fn(), navigate: jest.fn(), goBack: jest.fn() }),
  useFocusEffect: jest.fn((cb) => cb()),
  Stack: {
    Screen: 'Stack.Screen',
  },
  Link: 'Link',
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

// Mock expo-secure-store more thoroughly
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    All: 'All',
    Videos: 'Videos',
    Images: 'Images',
  },
  ImagePickerResult: {
    Canceled: 'canceled',
  },
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
  DocumentPickerOptions: {
    type: 'application/pdf',
  },
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  dismissReader: jest.fn(),
  SharingOptions: {},
}));

// Note: StyleSheet.flatten mock is handled individually in test files that need it
// to avoid conflicts with react-native-reanimated mock

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    Svg: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref, testID: 'svg' })),
    Circle: (props) => React.createElement('View', { ...props, testID: 'circle' }),
    Path: (props) => React.createElement('View', { ...props, testID: 'path' }),
    Defs: (props) => React.createElement('View', { ...props, testID: 'defs' }),
    LinearGradient: (props) => React.createElement('View', { ...props, testID: 'linear-gradient' }),
    Stop: (props) => React.createElement('View', { ...props, testID: 'stop' }),
    G: (props) => React.createElement('View', { ...props, testID: 'g' }),
    Text: (props) => React.createElement('Text', props),
    TSpan: (props) => React.createElement('Text', props),
    TextPath: (props) => React.createElement('Text', props),
    Polygon: (props) => React.createElement('View', { ...props, testID: 'polygon' }),
    Polyline: (props) => React.createElement('View', { ...props, testID: 'polyline' }),
    Line: (props) => React.createElement('View', { ...props, testID: 'line' }),
    Rect: (props) => React.createElement('View', { ...props, testID: 'rect' }),
    Use: (props) => React.createElement('View', { ...props, testID: 'use' }),
    Image: (props) => React.createElement('Image', props),
    Symbol: (props) => React.createElement('View', { ...props, testID: 'symbol' }),
    Marker: (props) => React.createElement('View', { ...props, testID: 'marker' }),
    ClipPath: (props) => React.createElement('View', { ...props, testID: 'clip-path' }),
    Pattern: (props) => React.createElement('View', { ...props, testID: 'pattern' }),
    Mask: (props) => React.createElement('View', { ...props, testID: 'mask' }),
  };
});

// Configure React Native Testing Library
// Note: Starting from v13, built-in Jest matchers are automatically included
// when you import from @testing-library/react-native

// Additional React Native mocks for better testing
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
  scheduleLayoutAnimation: jest.fn(),
  isVisible: jest.fn().mockReturnValue(false),
  metrics: jest.fn().mockReturnValue(undefined),
}));

// Only mock modules that are actually used in the project
global.jest = jest; 