module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/**/*.spec.js",
  ],
  testMatch: ["**/tests/**/*.test.js", "**/tests/**/*.spec.js"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  verbose: true,
  testTimeout: 30000, // 30 seconds for database operations
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
