/**
 * Password Service
 *
 * Provides secure password hashing, comparison, and random token generation
 * functionality for the authentication system.
 *
 * @module services/auth/PasswordService
 */

const crypto = require("@/utilities/crypto");

/**
 * Hash a plain text password using bcrypt
 *
 * @param plainPassword - Plain text password to hash
 * @returns Promise<string> - Hashed password
 * @throws Error if password is invalid or hashing fails
 */
exports.hashPassword = async (plainPassword: string): Promise<string> => {
  if (!plainPassword) {
    throw new Error("Password cannot be empty");
  }

  if (typeof plainPassword !== "string") {
    throw new Error("Password must be a string");
  }

  if (plainPassword.length < 6) {
    throw new Error("Password must be at least 6 characters long");
  }

  try {
    return await crypto.hash(plainPassword);
  } catch (error: any) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Compare a plain text password with a hashed password
 *
 * @param plainPassword - Plain text password to verify
 * @param hashedPassword - Hashed password to compare against
 * @returns Promise<boolean> - True if passwords match, false otherwise
 * @throws Error if parameters are invalid or comparison fails
 */
exports.comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  if (!plainPassword || !hashedPassword) {
    throw new Error("Both password and hash are required");
  }

  if (typeof plainPassword !== "string" || typeof hashedPassword !== "string") {
    throw new Error("Password and hash must be strings");
  }

  try {
    return await crypto.compare(plainPassword, hashedPassword);
  } catch (error: any) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

/**
 * Generate a cryptographically secure random token
 *
 * @param length - Length of the token (default: 32)
 * @returns string - Secure random token
 * @throws Error if length is invalid
 */
exports.generateRandomToken = (length: number = 32): string => {
  if (typeof length !== "number" || length <= 0 || !Number.isInteger(length)) {
    throw new Error("Token length must be a positive integer");
  }

  if (length > 256) {
    throw new Error("Token length cannot exceed 256 characters");
  }

  try {
    return crypto.generateRandomToken(length);
  } catch (error: any) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

/**
 * Generate a secure password reset token
 *
 * @returns string - 64-character secure token for password reset
 */
exports.generatePasswordResetToken = (): string => {
  return exports.generateRandomToken(64);
};

/**
 * Generate a secure email verification token
 *
 * @returns string - 32-character secure token for email verification
 */
exports.generateEmailVerificationToken = (): string => {
  return exports.generateRandomToken(32);
};

/**
 * Validate password strength
 *
 * @param password - Password to validate
 * @returns Object containing validation result and feedback
 */
exports.validatePasswordStrength = (
  password: string
): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      score: 0,
      feedback: ["Password must be provided as a string"],
    };
  }

  // Length check
  if (password.length < 6) {
    feedback.push("Password must be at least 6 characters long");
  } else if (password.length >= 8) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Additional feedback for weak passwords only
  if (score < 3) {
    if (!/[a-z]/.test(password)) {
      feedback.push("Include lowercase letters");
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push("Include uppercase letters");
    }
    if (!/[0-9]/.test(password)) {
      feedback.push("Include numbers");
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push("Include special characters");
    }
  }

  // Common patterns check (only for exact matches or very weak passwords)
  const commonPatterns = ["123456", "qwerty", "abc123"];
  const weakPasswords = ["password", "admin", "user", "test"];

  if (
    commonPatterns.some((pattern) =>
      password.toLowerCase().includes(pattern)
    ) ||
    weakPasswords.some((weak) => password.toLowerCase() === weak)
  ) {
    feedback.push("Avoid common patterns");
    score = Math.max(0, score - 2);
  }

  const isValid = password.length >= 6 && score >= 3;

  return {
    isValid,
    score: Math.min(5, score),
    feedback,
  };
};
