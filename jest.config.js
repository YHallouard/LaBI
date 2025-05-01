/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-native|react-native|expo-sqlite)/)'
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^src/infrastructure/database/DatabaseInitializer$': '<rootDir>/src/infrastructure/database/__mocks__/DatabaseInitializer.ts'
  }
}; 