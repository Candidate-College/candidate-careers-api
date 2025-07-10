/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: "ts-jest",

  // Test environment
  testEnvironment: "node",

  // Root directory for tests
  roots: ["<rootDir>/src", "<rootDir>/tests"],

  // Test file patterns
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.spec.ts",
    "**/__tests__/**/*.ts",
  ],

  // Transform files with ts-jest
  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  // Module name mapping for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/app.ts",
    "!src/database/migrations/**",
    "!src/database/seeders/**",
    "!src/types/**",
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Coverage reporters
  coverageReporters: ["text", "lcov", "html"],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Module file extensions
  moduleFileExtensions: ["ts", "js", "json"],

  // Clear mocks between tests
  clearMocks: true,

  // Verbose output
  verbose: true,
};
