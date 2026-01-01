/**
 * Integration Tests for Auth Endpoints
 *
 * Tests the /api/auth/register and /api/auth/login endpoints
 * using supertest and an in-memory MongoDB instance.
 */

const request = require("supertest");
const app = require("../../src/index");
const User = require("../../src/models/User");
const { connect, closeDatabase, clearDatabase } = require("../utils/testDb");

// Test data
const validUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  password: "SecurePass123",
};

const validUser2 = {
  name: "Jane Smith",
  email: "jane.smith@example.com",
  password: "AnotherPass456",
};

// Setup and teardown
beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("POST /api/auth/register", () => {
  describe("Successful Registration", () => {
    it("should register a new user with valid data", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("User registered successfully");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("expiresIn");

      // Verify user data
      expect(response.body.data.user.name).toBe(validUser.name);
      expect(response.body.data.user.email).toBe(validUser.email.toLowerCase());
      expect(response.body.data.user).toHaveProperty("id");
      expect(response.body.data.user).toHaveProperty("createdAt");
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
      expect(response.body.data.user).not.toHaveProperty("password");

      // Verify token is a string
      expect(typeof response.body.data.token).toBe("string");
      expect(response.body.data.token.length).toBeGreaterThan(0);
    });

    it("should store hashed password in database", async () => {
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      const user = await User.findOne({
        email: validUser.email.toLowerCase(),
      }).select("+passwordHash");

      expect(user).toBeDefined();
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(validUser.password);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it("should normalize email to lowercase", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          email: "JOHN.DOE@EXAMPLE.COM",
        })
        .expect(201);

      expect(response.body.data.user.email).toBe("john.doe@example.com");
    });

    it("should trim whitespace from name and email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "  John Doe  ",
          email: "  john.doe@example.com  ",
          password: "SecurePass123",
        })
        .expect(201);

      expect(response.body.data.user.name).toBe("John Doe");
      expect(response.body.data.user.email).toBe("john.doe@example.com");
    });
  });

  describe("Validation Errors", () => {
    it("should reject registration with missing name", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "name")).toBe(true);
    });

    it("should reject registration with missing email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: validUser.name,
          password: validUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should reject registration with missing password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: validUser.name,
          email: validUser.email,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject registration with invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          email: "invalid-email",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should reject registration with short password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "Short1",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject registration with password without uppercase letter", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "lowercase123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject registration with password without lowercase letter", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "UPPERCASE123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject registration with password without number", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          password: "NoNumbersHere",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject registration with name too short", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          name: "A",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "name")).toBe(true);
    });

    it("should reject registration with name too long", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          name: "A".repeat(101),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "name")).toBe(true);
    });
  });

  describe("Duplicate User", () => {
    it("should reject registration with duplicate email", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(validUser)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });

    it("should reject registration with duplicate email regardless of case", async () => {
      // Register first user
      await request(app).post("/api/auth/register").send(validUser).expect(201);

      // Try to register with same email but different case
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          ...validUser,
          email: validUser.email.toUpperCase(),
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });
});

describe("POST /api/auth/login", () => {
  // Register a user before login tests
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(validUser).expect(201);
  });

  describe("Successful Login", () => {
    it("should login user with valid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Login successful");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("token");
      expect(response.body.data).toHaveProperty("expiresIn");

      // Verify user data
      expect(response.body.data.user.email).toBe(validUser.email.toLowerCase());
      expect(response.body.data.user.name).toBe(validUser.name);
      expect(response.body.data.user).not.toHaveProperty("passwordHash");
      expect(response.body.data.user).not.toHaveProperty("password");

      // Verify token
      expect(typeof response.body.data.token).toBe("string");
      expect(response.body.data.token.length).toBeGreaterThan(0);
    });

    it("should login with email in different case", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email.toUpperCase(),
          password: validUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validUser.email.toLowerCase());
    });

    it("should update lastLogin timestamp", async () => {
      const userBefore = await User.findOne({
        email: validUser.email.toLowerCase(),
      });
      const lastLoginBefore = userBefore.lastLogin;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      const userAfter = await User.findOne({
        email: validUser.email.toLowerCase(),
      });

      expect(userAfter.lastLogin).toBeDefined();
      if (lastLoginBefore) {
        expect(userAfter.lastLogin.getTime()).toBeGreaterThan(
          lastLoginBefore.getTime()
        );
      }
    });
  });

  describe("Login Validation Errors", () => {
    it("should reject login with missing email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          password: validUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should reject login with missing password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "password")).toBe(
        true
      );
    });

    it("should reject login with invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: validUser.password,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some((e) => e.field === "email")).toBe(true);
    });
  });

  describe("Login Authentication Errors", () => {
    it("should reject login with non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: validUser.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should reject login with incorrect password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: "WrongPassword123",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid email or password");
    });

    it("should not reveal if email exists when password is wrong", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: "WrongPassword123",
        })
        .expect(401);

      // Should use same message for wrong password as non-existent user
      expect(response.body.message).toBe("Invalid email or password");
    });
  });

  describe("Token Generation", () => {
    it("should generate different tokens for different login sessions", async () => {
      const response1 = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response2 = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      expect(response1.body.data.token).not.toBe(response2.body.data.token);
    });

    it("should generate different tokens for different users", async () => {
      // Register second user
      await request(app)
        .post("/api/auth/register")
        .send(validUser2)
        .expect(201);

      const response1 = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      const response2 = await request(app)
        .post("/api/auth/login")
        .send({
          email: validUser2.email,
          password: validUser2.password,
        })
        .expect(200);

      expect(response1.body.data.token).not.toBe(response2.body.data.token);
    });
  });
});
