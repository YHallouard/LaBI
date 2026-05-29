/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: [
    'node_modules',
    'src'
  ],
  testMatch: ['**/__tests__/**/*.spec.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/labi_old/'],
  modulePathIgnorePatterns: ['/labi_old/'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@testing-library|expo|expo-.*|@expo|@unimodules|unimodules-|@react-navigation|uuid)/)',
  ],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
    '^src/infrastructure/database/DatabaseInitializer$': '<rootDir>/src/infrastructure/database/__mocks__/DatabaseInitializer.ts',
    '^expo-file-system/legacy$': 'expo-file-system',
    '^expo-glass-effect$': '<rootDir>/__mocks__/expo-glass-effect.ts',
    '^react-native-zeroconf$': '<rootDir>/__mocks__/react-native-zeroconf.ts',
    '^react-native-tcp-socket$': '<rootDir>/__mocks__/react-native-tcp-socket.ts'
  }
}; 