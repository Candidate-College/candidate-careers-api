const bcrypt = require('bcrypt');

/**
 * Converts string into hashed string
 */
exports.hash = async (string: string): Promise<string> => {
  return await bcrypt.hash(string, 10);
}

/**
 * Compares string to a hashed string
 */
exports.compare = async (string: string, hashedString: string): Promise<boolean> => {
  return await bcrypt.compare(string, hashedString);
}
