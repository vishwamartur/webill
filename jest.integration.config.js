const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/src/',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  globalSetup: '<rootDir>/tests/integration/setup.js',
  globalTeardown: '<rootDir>/tests/integration/teardown.js',
  maxWorkers: 1, // Run integration tests sequentially
}

module.exports = createJestConfig(customJestConfig)
