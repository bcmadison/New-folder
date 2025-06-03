const tsJestPreset = require('ts-jest/presets').jsWithBabel;

module.exports = {
  ...tsJestPreset,
  testEnvironment: 'jsdom',
  rootDir: '.',
  setupFiles: ['<rootDir>/a-env-setup.js', 'jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts', '<rootDir>/jest.setup.js'], // For global jest-dom and JSDOM/Framer Motion/Chart.js mocks
  globals: {
    'ts-jest': {
      babelConfig: '<rootDir>/babel.config.cjs',
      useBabelrc: true,
    },
  },
  moduleNameMapper: {
    // Handle CSS imports (if any)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1', // Points to betaTest4/src/core
  },
  testMatch: [
    '<rootDir>/src/test/**/*.test.(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transformIgnorePatterns: [
    '/node_modules/(?!(react|react-dom|@testing-library|@tanstack|framer-motion|chart.js|react-chartjs-2)/)',
  ],
  // Add verbose logging to help debug module resolution issues
  // verbose: true, // Temporarily enable for debugging
}; 