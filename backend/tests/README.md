# Backend Tests

This directory contains integration and unit tests for the Apricity backend API.

## Test Structure

```
tests/
├── setup.js              # Jest global setup (environment variables)
├── basic.test.js         # Basic sanity tests
├── auth.test.js          # Auth endpoints tests (register/login)
└── utils/
    └── testDb.js         # In-memory MongoDB setup utilities
```

## Technology Stack

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertions for API testing
- **mongodb-memory-server**: In-memory MongoDB for isolated tests

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Specific Test File

```bash
npm test auth.test.js
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Run Verbose

```bash
npm test -- --verbose
```

## Test Database

Tests use **mongodb-memory-server** which provides an in-memory MongoDB instance. This means:

- ✅ No need for a running MongoDB server
- ✅ Fast test execution
- ✅ Isolated test environment
- ✅ Automatic cleanup between tests
- ✅ No database pollution

### Database Lifecycle

1. **Before All Tests**: In-memory MongoDB starts
2. **Before Each Test**: Database is cleared
3. **After Each Test**: Collections are cleaned
4. **After All Tests**: Database connection closes and server stops

## Auth Endpoint Tests

The `auth.test.js` file includes comprehensive tests for authentication:

### Registration Tests (`POST /api/auth/register`)

**Successful Cases:**

- ✅ Register with valid data
- ✅ Password is hashed before storage
- ✅ Email is normalized to lowercase
- ✅ Whitespace is trimmed from inputs
- ✅ JWT token is generated

**Validation Tests:**

- ✅ Missing name/email/password rejected
- ✅ Invalid email format rejected
- ✅ Short password rejected (< 8 characters)
- ✅ Password without uppercase rejected
- ✅ Password without lowercase rejected
- ✅ Password without number rejected
- ✅ Name too short/long rejected

**Business Logic:**

- ✅ Duplicate email rejected (409 Conflict)
- ✅ Case-insensitive email uniqueness

### Login Tests (`POST /api/auth/login`)

**Successful Cases:**

- ✅ Login with valid credentials
- ✅ Case-insensitive email matching
- ✅ LastLogin timestamp updated
- ✅ JWT token generated

**Validation Tests:**

- ✅ Missing email/password rejected
- ✅ Invalid email format rejected

**Authentication Tests:**

- ✅ Non-existent email rejected (401)
- ✅ Incorrect password rejected (401)
- ✅ Same error message for security

**Token Tests:**

- ✅ Different tokens per session
- ✅ Different tokens per user

## Test Coverage

Current test coverage for auth endpoints:

- **Register endpoint**: 20+ test cases
- **Login endpoint**: 15+ test cases
- **Total assertions**: 100+ assertions

Run `npm test -- --coverage` to see detailed coverage report.

## Writing New Tests

### Example Test Structure

```javascript
const request = require("supertest");
const app = require("../src/index");
const { connect, closeDatabase, clearDatabase } = require("./utils/testDb");

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Your Test Suite", () => {
  it("should do something", async () => {
    const response = await request(app)
      .post("/api/endpoint")
      .send({ data: "value" })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### Best Practices

1. **Use descriptive test names**:

   - ✅ `should reject registration with missing email`
   - ❌ `test 1`

2. **Test one thing per test**:

   ```javascript
   // Good
   it("should return 400 for invalid email", async () => { ... });
   it("should return 400 for missing password", async () => { ... });

   // Bad
   it("should validate all fields", async () => {
     // Tests multiple validations
   });
   ```

3. **Clean up after tests**:

   ```javascript
   afterEach(async () => {
     await clearDatabase();
   });
   ```

4. **Use async/await consistently**:

   ```javascript
   it("should work", async () => {
     const result = await someAsyncFunction();
     expect(result).toBe(expected);
   });
   ```

5. **Test both success and failure cases**:
   ```javascript
   describe("Success cases", () => { ... });
   describe("Validation errors", () => { ... });
   describe("Business logic errors", () => { ... });
   ```

## Debugging Tests

### Run Single Test

```bash
npm test -- -t "should register a new user"
```

### Enable Console Logs

Comment out console suppression in `setup.js`:

```javascript
// global.console = {
//   ...console,
//   log: jest.fn(),
// };
```

### Inspect Database State

Add temporary logging in tests:

```javascript
const users = await User.find({});
console.log("Current users:", users);
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## Common Issues

### MongoDB Connection Timeout

If tests timeout, increase `testTimeout` in `jest.config.js`:

```javascript
testTimeout: 30000, // 30 seconds
```

### Port Already in Use

The test app might conflict with running dev server. Make sure dev server is stopped:

```bash
# Stop dev server before running tests
npm test
```

### Memory Issues

For large test suites, you may need to increase Node memory:

```bash
NODE_OPTIONS=--max_old_space_size=4096 npm test
```

### Flaky Tests

If tests are inconsistent:

1. Check for shared state between tests
2. Ensure proper cleanup in `afterEach`
3. Add delays for async operations
4. Use `clearDatabase()` between tests

## CI/CD Integration

Tests automatically run in GitHub Actions on:

- Push to `main` or `develop`
- Pull requests

See `.github/workflows/ci.yml` for pipeline configuration.

### Coverage Reports

Coverage reports are uploaded as artifacts after each test run:

- Retention: 7 days
- Format: HTML and JSON
- Access: GitHub Actions artifacts section

## Future Tests

Planned test additions:

- [ ] User profile endpoint tests
- [ ] Diary CRUD operation tests
- [ ] Emotion analysis endpoint tests
- [ ] Protected route authorization tests
- [ ] Input sanitization tests
- [ ] Rate limiting tests
- [ ] Error handling tests

## Contributing

When adding new tests:

1. Follow existing test structure
2. Add tests for both success and error cases
3. Ensure tests are independent (no shared state)
4. Update this README if adding new test files
5. Maintain test coverage above 70%
