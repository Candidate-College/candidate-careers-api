/**
 * Password Service Unit Tests
 *
 * Tests for password hashing, comparison, and random token generation
 * covering both successful operations and error scenarios.
 */

// Jest globals are available without import in Jest environment
// Using global Jest functions: describe, test, expect, beforeEach, jest

// Mock the crypto utilities before importing the service
jest.mock("@/utilities/crypto");

const mockCrypto = {
  hash: jest.fn(),
  compare: jest.fn(),
  generateRandomToken: jest.fn(),
};

jest.doMock("@/utilities/crypto", () => mockCrypto);

// Import the service after mocking
const PasswordService = require("@/services/auth/PasswordService");

describe("Password Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Password Hashing", () => {
    test("should hash password successfully", async () => {
      const plainPassword = "mySecurePassword123";
      const hashedPassword = "$2b$12$hashed.password.string.here";

      mockCrypto.hash.mockResolvedValue(hashedPassword);

      const result = await PasswordService.hashPassword(plainPassword);

      expect(result).toBe(hashedPassword);
      expect(mockCrypto.hash).toHaveBeenCalledWith(plainPassword);
    });

    test("should generate different hashes for same password", async () => {
      const plainPassword = "samePassword";
      const hash1 = "$2b$12$hash1.different.salt";
      const hash2 = "$2b$12$hash2.different.salt";

      mockCrypto.hash.mockResolvedValueOnce(hash1).mockResolvedValueOnce(hash2);

      const result1 = await PasswordService.hashPassword(plainPassword);
      const result2 = await PasswordService.hashPassword(plainPassword);

      expect(result1).toBe(hash1);
      expect(result2).toBe(hash2);
      expect(result1).not.toBe(result2);
      expect(mockCrypto.hash).toHaveBeenCalledTimes(2);
    });

    test("should fail with empty password", async () => {
      await expect(PasswordService.hashPassword("")).rejects.toThrow(
        "Password cannot be empty"
      );
      await expect(PasswordService.hashPassword(null)).rejects.toThrow(
        "Password cannot be empty"
      );
      await expect(PasswordService.hashPassword(undefined)).rejects.toThrow(
        "Password cannot be empty"
      );
    });

    test("should fail with non-string password", async () => {
      await expect(PasswordService.hashPassword(123)).rejects.toThrow(
        "Password must be a string"
      );
      await expect(PasswordService.hashPassword({})).rejects.toThrow(
        "Password must be a string"
      );
      await expect(PasswordService.hashPassword([])).rejects.toThrow(
        "Password must be a string"
      );
    });

    test("should fail with password too short", async () => {
      await expect(PasswordService.hashPassword("12345")).rejects.toThrow(
        "Password must be at least 6 characters long"
      );
    });

    test("should handle hashing errors", async () => {
      const plainPassword = "validPassword123";
      mockCrypto.hash.mockRejectedValue(new Error("Hashing failed"));

      await expect(PasswordService.hashPassword(plainPassword)).rejects.toThrow(
        "Password hashing failed: Hashing failed"
      );
    });
  });

  describe("Password Comparison", () => {
    test("should return true for correct password", async () => {
      const plainPassword = "correctPassword";
      const hashedPassword = "$2b$12$hashed.password.string.here";

      mockCrypto.compare.mockResolvedValue(true);

      const result = await PasswordService.comparePassword(
        plainPassword,
        hashedPassword
      );

      expect(result).toBe(true);
      expect(mockCrypto.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword
      );
    });

    test("should return false for incorrect password", async () => {
      const plainPassword = "wrongPassword";
      const hashedPassword = "$2b$12$hashed.password.string.here";

      mockCrypto.compare.mockResolvedValue(false);

      const result = await PasswordService.comparePassword(
        plainPassword,
        hashedPassword
      );

      expect(result).toBe(false);
      expect(mockCrypto.compare).toHaveBeenCalledWith(
        plainPassword,
        hashedPassword
      );
    });

    test("should fail with invalid hash format", async () => {
      const plainPassword = "password123";
      const invalidHash = "not-a-valid-hash";

      mockCrypto.compare.mockRejectedValue(new Error("Invalid hash format"));

      await expect(
        PasswordService.comparePassword(plainPassword, invalidHash)
      ).rejects.toThrow("Password comparison failed: Invalid hash format");
    });

    test("should fail with null parameters", async () => {
      await expect(
        PasswordService.comparePassword(null, "hash")
      ).rejects.toThrow("Both password and hash are required");
      await expect(
        PasswordService.comparePassword("password", null)
      ).rejects.toThrow("Both password and hash are required");
      await expect(PasswordService.comparePassword("", "hash")).rejects.toThrow(
        "Both password and hash are required"
      );
      await expect(
        PasswordService.comparePassword("password", "")
      ).rejects.toThrow("Both password and hash are required");
    });

    test("should fail with non-string parameters", async () => {
      await expect(
        PasswordService.comparePassword(123, "hash")
      ).rejects.toThrow("Password and hash must be strings");
      await expect(
        PasswordService.comparePassword("password", 123)
      ).rejects.toThrow("Password and hash must be strings");
    });
  });

  describe("Random Token Generation", () => {
    test("should generate random token with default length", () => {
      const mockToken = "abcdef1234567890abcdef1234567890";
      mockCrypto.generateRandomToken.mockReturnValue(mockToken);

      const result = PasswordService.generateRandomToken();

      expect(result).toBe(mockToken);
      expect(mockCrypto.generateRandomToken).toHaveBeenCalledWith(32);
    });

    test("should generate random token with custom length", () => {
      const mockToken = "abcdef1234567890";
      mockCrypto.generateRandomToken.mockReturnValue(mockToken);

      const result = PasswordService.generateRandomToken(16);

      expect(result).toBe(mockToken);
      expect(mockCrypto.generateRandomToken).toHaveBeenCalledWith(16);
    });

    test("should fail with invalid length", () => {
      expect(() => PasswordService.generateRandomToken(-1)).toThrow(
        "Token length must be a positive integer"
      );
      expect(() => PasswordService.generateRandomToken(0)).toThrow(
        "Token length must be a positive integer"
      );
      expect(() => PasswordService.generateRandomToken(1.5)).toThrow(
        "Token length must be a positive integer"
      );
      expect(() => PasswordService.generateRandomToken("invalid")).toThrow(
        "Token length must be a positive integer"
      );
    });

    test("should fail with length too large", () => {
      expect(() => PasswordService.generateRandomToken(500)).toThrow(
        "Token length cannot exceed 256 characters"
      );
    });

    test("should handle token generation errors", () => {
      mockCrypto.generateRandomToken.mockImplementation(() => {
        throw new Error("Token generation failed");
      });

      expect(() => PasswordService.generateRandomToken(32)).toThrow(
        "Token generation failed: Token generation failed"
      );
    });
  });

  describe("Specialized Token Generation", () => {
    test("should generate password reset token", () => {
      const mockToken = "a".repeat(64);
      mockCrypto.generateRandomToken.mockReturnValue(mockToken);

      const result = PasswordService.generatePasswordResetToken();

      expect(result).toBe(mockToken);
      expect(mockCrypto.generateRandomToken).toHaveBeenCalledWith(64);
    });

    test("should generate email verification token", () => {
      const mockToken = "b".repeat(32);
      mockCrypto.generateRandomToken.mockReturnValue(mockToken);

      const result = PasswordService.generateEmailVerificationToken();

      expect(result).toBe(mockToken);
      expect(mockCrypto.generateRandomToken).toHaveBeenCalledWith(32);
    });
  });

  describe("Password Strength Validation", () => {
    test("should validate strong password", () => {
      const result =
        PasswordService.validatePasswordStrength("MyStr0ng!Password");

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toEqual([]);
    });

    test("should validate medium password", () => {
      const result = PasswordService.validatePasswordStrength("Password123");

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    test("should reject password too short", () => {
      const result = PasswordService.validatePasswordStrength("12345");

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain(
        "Password must be at least 6 characters long"
      );
    });

    test("should provide feedback for missing character types", () => {
      const result = PasswordService.validatePasswordStrength("password");

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain("Include uppercase letters");
      expect(result.feedback).toContain("Include numbers");
      expect(result.feedback).toContain("Include special characters");
    });

    test("should detect common patterns", () => {
      const result = PasswordService.validatePasswordStrength("123456789");

      expect(result.isValid).toBe(false);
      expect(result.feedback).toContain("Avoid common patterns");
      expect(result.score).toBeLessThan(3);
    });

    test("should handle invalid input", () => {
      const result1 = PasswordService.validatePasswordStrength(null);
      const result2 = PasswordService.validatePasswordStrength(undefined);
      const result3 = PasswordService.validatePasswordStrength(123);

      expect(result1.isValid).toBe(false);
      expect(result1.feedback).toContain(
        "Password must be provided as a string"
      );

      expect(result2.isValid).toBe(false);
      expect(result2.feedback).toContain(
        "Password must be provided as a string"
      );

      expect(result3.isValid).toBe(false);
      expect(result3.feedback).toContain(
        "Password must be provided as a string"
      );
    });

    test("should score password correctly", () => {
      // Test various password combinations
      const weak = PasswordService.validatePasswordStrength("password");
      const medium = PasswordService.validatePasswordStrength("Password123");
      const strong =
        PasswordService.validatePasswordStrength("MyStr0ng!Password");

      expect(weak.score).toBeLessThan(medium.score);
      expect(medium.score).toBeLessThan(strong.score);
    });
  });
});
