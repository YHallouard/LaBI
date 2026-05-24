/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleDirectories: [
    'node_modules',
    'src'
  ],
  testMatch: ['**/__tests__/**/*.spec.{ts,tsx}'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@testing-library|expo-.*|@expo|@react-navigation|uuid)/)',
  ],
  moduleNameMapper: {
    '^.+\\.(css|less|scss)$': 'identity-obj-proxy',
    '^src/infrastructure/database/DatabaseInitializer$': '<rootDir>/src/infrastructure/database/__mocks__/DatabaseInitializer.ts',
    '^expo-file-system/legacy$': 'expo-file-system',
    '^expo-glass-effect$': '<rootDir>/__mocks__/expo-glass-effect.ts'
  }
}; 