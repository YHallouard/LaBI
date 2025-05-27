// Jest setup for React Native testing

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
  deleteAsync: jest.fn(),
}));

// Mock missing modules that might be referenced in ProfileRequiredModal
jest.mock('../../screens/CreateProfileModal', () => ({
  CreateProfileModal: 'CreateProfileModal',
}), { virtual: true });

// Only mock modules that are actually used in the project
global.jest = jest; 