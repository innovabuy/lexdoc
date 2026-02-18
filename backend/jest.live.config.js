/**
 * Jest config for live integration tests (real server on port 4000)
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/live-*.test.js'],
  globalSetup: '<rootDir>/tests/integration/live-globalSetup.js',
  globalTeardown: '<rootDir>/tests/integration/live-globalTeardown.js',
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
};
