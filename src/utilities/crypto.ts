const bcrypt = require("bcrypt");

/**
 * Get salt rounds from environment or use default
 */
const getSaltRounds = (): number => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12");
  return isNaN(saltRounds) ? 12 : saltRounds;
};

/**
 * Converts string into hashed string
 * @param string - Plain text string to hash
 * @returns Promise<string> - Hashed string
 */
exports.hash = async (string: string): Promise<string> => {
  if (!string || typeof string !== "string") {
    throw new Error("Invalid input: string must be a non-empty string");
  }

  const saltRounds = getSaltRounds();
  return await bcrypt.hash(string, saltRounds);
};

/**
 * Compares string to a hashed string
 * @param string - Plain text string to compare
 * @param hashedString - Hashed string to compare against
 * @returns Promise<boolean> - True if strings match, false otherwise
 */
exports.compare = async (
  string: string,
  hashedString: string
): Promise<boolean> => {
  if (!string || !hashedString) {
    throw new Error("Invalid input: both string and hashedString are required");
  }

  if (typeof string !== "string" || typeof hashedString !== "string") {
    throw new Error("Invalid input: both parameters must be strings");
  }

  return await bcrypt.compare(string, hashedString);
};

/**
 * Generates a secure random token
 * @param length - Length of the token (default: 32)
 * @returns string - Cryptographically secure random token
 */
exports.generateRandomToken = (length: number = 32): string => {
  if (length <= 0 || !Number.isInteger(length)) {
    throw new Error("Invalid length: must be a positive integer");
  }

  const crypto = require("crypto");
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};
