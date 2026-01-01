/**
 * Jest Global Setup
 *
 * Configuration and utilities that run before all tests.
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.JWT_EXPIRE = "7d";
process.env.BCRYPT_ROUNDS = "4"; // Use fewer rounds for faster tests

// Suppress console logs during tests (optional)
// Uncomment to reduce test output noise
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Set longer timeout for async operations
jest.setTimeout(30000);
