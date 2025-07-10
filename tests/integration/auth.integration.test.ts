/**
 * Authentication Integration Tests
 *
 * End-to-end integration tests for the complete authentication flow including
 * user registration, login, token refresh, protected route access, and comprehensive
 * error handling scenarios.
 */

import request from "supertest";
import { Express } from "express";

// Mock dependencies before importing the app
jest.mock("@/config/database/orm", () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUserSession: jest.fn(),
  createUserSession: jest.fn(),
  getUserSession: jest.fn(),
}));

jest.mock("@/utilities/mailer", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Import mocked dependencies
const mockDb = require("@/config/database/orm");
const mockMailer = require("@/utilities/mailer");

// Import app after mocking
let app: Express;

describe("Authentication Integration Tests", () => {
  beforeAll(async () => {
    // Dynamically import the app to ensure mocks are applied
    const appModule = await import("../../src/app");
    app = appModule.default || appModule;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset rate limiting for each test
    jest.resetModules();
  });

  describe("User Registration Flow", () => {
    const validUserData = {
      name: "John Doe",
      email: "john.doe@example.com",
      password: "SecurePassword123!",
      confirmPassword: "SecurePassword123!",
    };

    test("should successfully register a new user", async () => {
      // Mock database responses
      mockDb.getUserByEmail.mockResolvedValue(null); // User doesn't exist
      mockDb.createUser.mockResolvedValue({
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        email_verified_at: null,
        created_at: new Date(),
      });

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        message: expect.stringContaining("registered successfully"),
        data: {
          user: {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
          },
        },
      });

      // Verify database calls
      expect(mockDb.getUserByEmail).toHaveBeenCalledWith(
        "john.doe@example.com"
      );
      expect(mockDb.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John Doe",
          email: "john.doe@example.com",
          password: expect.any(String), // Hashed password
        })
      );

      // Verify email was sent
      expect(mockMailer.sendVerificationEmail).toHaveBeenCalledWith(
        "john.doe@example.com",
        expect.any(String) // Verification token
      );
    });

    test("should reject registration with existing email", async () => {
      // Mock user already exists
      mockDb.getUserByEmail.mockResolvedValue({
        id: 1,
        email: "john.doe@example.com",
      });

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: expect.stringContaining("already exists"),
      });

      expect(mockDb.createUser).not.toHaveBeenCalled();
      expect(mockMailer.sendVerificationEmail).not.toHaveBeenCalled();
    });

    test("should reject registration with invalid data", async () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        password: "weak",
        confirmPassword: "different",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("validation"),
      });

      expect(mockDb.createUser).not.toHaveBeenCalled();
    });

    test("should reject registration with weak password", async () => {
      const weakPasswordData = {
        ...validUserData,
        password: "123",
        confirmPassword: "123",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(weakPasswordData)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("password"),
      });
    });

    test("should reject registration with mismatched passwords", async () => {
      const mismatchedData = {
        ...validUserData,
        confirmPassword: "DifferentPassword123!",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(mismatchedData)
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("match"),
      });
    });
  });

  describe("User Login Flow", () => {
    const loginCredentials = {
      email: "john.doe@example.com",
      password: "SecurePassword123!",
    };

    const mockUser = {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      password: "$2b$12$hashedPasswordHere", // This would be a real bcrypt hash
      email_verified_at: new Date(),
      role: "user",
    };

    test("should successfully login with valid credentials", async () => {
      // Mock database responses
      mockDb.getUserByEmail.mockResolvedValue(mockUser);
      mockDb.createUserSession.mockResolvedValue({
        id: "session-123",
        user_id: 1,
        created_at: new Date(),
      });

      // Mock password comparison (would normally be handled by bcrypt)
      const bcrypt = require("bcrypt");
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginCredentials)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("successful"),
        data: {
          user: {
            id: 1,
            name: "John Doe",
            email: "john.doe@example.com",
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify tokens are JWT format
      expect(response.body.data.tokens.accessToken).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/
      );
      expect(response.body.data.tokens.refreshToken).toMatch(
        /^[\w-]+\.[\w-]+\.[\w-]+$/
      );

      // Verify refresh token is set as HTTP-only cookie
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("refresh_token=");
      expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
      expect(response.headers["set-cookie"][0]).toContain("Secure");

      // Verify database calls
      expect(mockDb.getUserByEmail).toHaveBeenCalledWith(
        "john.doe@example.com"
      );
      expect(mockDb.createUserSession).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 1,
        })
      );
    });

    test("should reject login with invalid email", async () => {
      mockDb.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginCredentials)
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("Invalid credentials"),
      });

      expect(mockDb.createUserSession).not.toHaveBeenCalled();
    });

    test("should reject login with invalid password", async () => {
      mockDb.getUserByEmail.mockResolvedValue(mockUser);

      // Mock password comparison failure
      const bcrypt = require("bcrypt");
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginCredentials)
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("Invalid credentials"),
      });
    });

    test("should reject login for unverified email", async () => {
      const unverifiedUser = {
        ...mockUser,
        email_verified_at: null,
      };

      mockDb.getUserByEmail.mockResolvedValue(unverifiedUser);

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginCredentials)
        .expect(403);

      expect(response.body).toMatchObject({
        statusCode: 403,
        message: expect.stringContaining("verify your email"),
      });
    });
  });

  describe("Token Refresh Flow", () => {
    test("should successfully refresh valid token", async () => {
      const mockSession = {
        id: "session-123",
        user_id: 1,
        created_at: new Date(),
      };

      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john.doe@example.com",
        role: "user",
      };

      // Mock successful token verification (would be handled by JWT middleware)
      mockDb.getUserSession.mockResolvedValue(mockSession);
      mockDb.getUserByEmail.mockResolvedValue(mockUser);

      // Create a valid refresh token first
      const jwt = require("jsonwebtoken");
      const refreshToken = jwt.sign(
        { id: "session-123", type: "refresh" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "7d" }
      );

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("refreshed"),
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
          },
        },
      });

      // Verify new tokens are different from the original
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);
    });

    test("should reject refresh with missing token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("token is required"),
      });
    });

    test("should handle expired refresh token gracefully", async () => {
      // Create an expired token
      const jwt = require("jsonwebtoken");
      const expiredToken = jwt.sign(
        { id: "session-123", type: "refresh" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1d" } // Expired
      );

      const response = await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refresh_token=${expiredToken}`])
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("expired"),
      });
    });
  });

  describe("Protected Route Access", () => {
    let accessToken: string;

    beforeEach(() => {
      // Create a valid access token for testing
      const jwt = require("jsonwebtoken");
      accessToken = jwt.sign(
        {
          id: 1,
          email: "john.doe@example.com",
          role: "user",
          type: "access",
        },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "15m" }
      );
    });

    test("should access protected route with valid token", async () => {
      // Mock any protected endpoint
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
      });
    });

    test("should reject protected route without token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("token is required"),
      });
    });

    test("should reject protected route with invalid token", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", "Bearer invalid.token.here")
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("Invalid"),
      });
    });

    test("should reject protected route with expired token", async () => {
      const jwt = require("jsonwebtoken");
      const expiredToken = jwt.sign(
        { id: 1, email: "john.doe@example.com", type: "access" },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1h" } // Expired
      );

      const response = await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("expired"),
      });
    });
  });

  describe("Logout Flow", () => {
    test("should successfully logout user", async () => {
      const refreshToken = "valid.refresh.token";

      mockDb.deleteUserSession.mockResolvedValue(true);

      const response = await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", [`refresh_token=${refreshToken}`])
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("logged out"),
      });

      // Verify refresh token cookie is cleared
      expect(response.headers["set-cookie"]).toBeDefined();
      expect(response.headers["set-cookie"][0]).toContain("refresh_token=;");
      expect(response.headers["set-cookie"][0]).toContain("Max-Age=0");

      expect(mockDb.deleteUserSession).toHaveBeenCalled();
    });

    test("should handle logout without refresh token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/logout")
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("logged out"),
      });
    });
  });

  describe("Email Verification Flow", () => {
    test("should successfully verify email with valid token", async () => {
      const verificationToken = "valid.verification.token";

      mockDb.updateUser.mockResolvedValue({
        id: 1,
        email_verified_at: new Date(),
      });

      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("verified"),
      });

      expect(mockDb.updateUser).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          email_verified_at: expect.any(Date),
        })
      );
    });

    test("should reject email verification with invalid token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: "invalid.token" })
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("Invalid"),
      });
    });

    test("should reject email verification without token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({})
        .expect(401);

      expect(response.body).toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("required"),
      });
    });
  });

  describe("Password Reset Flow", () => {
    test("should successfully initiate password reset", async () => {
      const email = "john.doe@example.com";

      mockDb.getUserByEmail.mockResolvedValue({
        id: 1,
        email: email,
      });

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email })
        .expect(200);

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("reset link"),
      });

      expect(mockMailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        expect.any(String) // Reset token
      );
    });

    test("should handle password reset for non-existent email", async () => {
      mockDb.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(200); // Should return 200 for security

      expect(response.body).toMatchObject({
        statusCode: 200,
        message: expect.stringContaining("reset link"),
      });

      expect(mockMailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe("Rate Limiting Integration", () => {
    test("should enforce rate limits on login attempts", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Mock user exists but password is wrong
      mockDb.getUserByEmail.mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "$2b$12$hashedPassword",
      });

      const bcrypt = require("bcrypt");
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      // Make multiple failed login attempts
      const requests = Array(6)
        .fill(null)
        .map(() => request(app).post("/api/v1/auth/login").send(loginData));

      const responses = await Promise.all(requests);

      // First 5 should return 401 (invalid credentials)
      responses.slice(0, 5).forEach((response) => {
        expect(response.status).toBe(401);
      });

      // 6th should return 429 (rate limited)
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toMatchObject({
        statusCode: 429,
        message: expect.stringContaining("rate limit"),
      });
    });

    test("should enforce rate limits on registration attempts", async () => {
      const registrationData = {
        name: "Test User",
        email: "test@example.com",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      };

      // Make multiple registration attempts
      const requests = Array(6)
        .fill(null)
        .map(() =>
          request(app).post("/api/v1/auth/register").send(registrationData)
        );

      const responses = await Promise.all(requests);

      // Last request should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toMatchObject({
        statusCode: 429,
        message: expect.stringContaining("rate limit"),
      });
    });
  });

  describe("Security Headers Integration", () => {
    test("should include security headers in responses", async () => {
      const response = await request(app)
        .get("/api/v1/auth/profile")
        .expect(401); // Will fail auth but still return headers

      // Check for security headers
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBeDefined();
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });

    test("should include CORS headers for cross-origin requests", async () => {
      const response = await request(app)
        .options("/api/v1/auth/login")
        .set("Origin", "http://localhost:3000")
        .expect(204);

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
      expect(response.headers["access-control-allow-methods"]).toBeDefined();
      expect(response.headers["access-control-allow-headers"]).toBeDefined();
    });
  });

  describe("Error Handling Integration", () => {
    test("should handle database connection errors gracefully", async () => {
      // Mock database error
      mockDb.getUserByEmail.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(500);

      expect(response.body).toMatchObject({
        statusCode: 500,
        message: expect.stringContaining("internal server error"),
      });
    });

    test("should handle malformed JSON requests", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("Invalid JSON"),
      });
    });

    test("should handle missing Content-Type header", async () => {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "password",
        })
        .expect(200);

      // Should work with default Content-Type handling
      expect(response.status).toBeLessThan(500);
    });
  });

  describe("End-to-End Authentication Flow", () => {
    test("should complete full authentication lifecycle", async () => {
      const userData = {
        name: "Integration Test User",
        email: "integration@example.com",
        password: "SecurePassword123!",
        confirmPassword: "SecurePassword123!",
      };

      // Step 1: Register user
      mockDb.getUserByEmail.mockResolvedValueOnce(null); // User doesn't exist
      mockDb.createUser.mockResolvedValueOnce({
        id: 1,
        ...userData,
        email_verified_at: null,
      });

      const registerResponse = await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);

      expect(registerResponse.body.statusCode).toBe(201);

      // Step 2: Login should fail (email not verified)
      mockDb.getUserByEmail.mockResolvedValueOnce({
        id: 1,
        ...userData,
        password: "$2b$12$hashedPassword",
        email_verified_at: null,
      });

      await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(403);

      // Step 3: Verify email
      mockDb.updateUser.mockResolvedValueOnce({
        id: 1,
        email_verified_at: new Date(),
      });

      await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: "valid.verification.token" })
        .expect(200);

      // Step 4: Login should now succeed
      mockDb.getUserByEmail.mockResolvedValueOnce({
        id: 1,
        ...userData,
        password: "$2b$12$hashedPassword",
        email_verified_at: new Date(),
      });
      mockDb.createUserSession.mockResolvedValueOnce({
        id: "session-123",
        user_id: 1,
      });

      const bcrypt = require("bcrypt");
      jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

      const loginResponse = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const { accessToken, refreshToken } = loginResponse.body.data.tokens;

      // Step 5: Access protected resource
      await request(app)
        .get("/api/v1/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      // Step 6: Refresh token
      await request(app)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refresh_token=${refreshToken}`])
        .expect(200);

      // Step 7: Logout
      mockDb.deleteUserSession.mockResolvedValueOnce(true);

      await request(app)
        .post("/api/v1/auth/logout")
        .set("Cookie", [`refresh_token=${refreshToken}`])
        .expect(200);

      console.log("✅ Complete authentication lifecycle test passed");
    });
  });
});
