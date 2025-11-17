/**
 * Konfiguracja Jest dla testów
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Ścieżka do aplikacji Next.js
  dir: './',
})

const customJestConfig = {
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // Test patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Coverage
  collectCoverageFrom: [
    'lib/**/*.{js,jsx}',
    'pages/**/*.{js,jsx}',
    'components/**/*.{js,jsx}',
    '!pages/_app.js',
    '!pages/_document.js',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  // Coverage thresholds (opcjonalnie)
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Transform (dla Node.js modułów w lib/)
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['next/dist/build/swc/jest-transformer', {}],
  },

  // Module name mapper dla CSS modules
  moduleNameMapper: {
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
}

module.exports = createJestConfig(customJestConfig)
