import { v4 as uuidv4 } from 'uuid';

/**
 * Capitalize first character.
 */
exports.ucfirst = (string: string): string => {
  return String(string).charAt(0).toUpperCase() + String(string).slice(1);
};

/**
 * Generate random alphabet-numeric
 */
exports.generateRandomAlphanum = (length: number): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  
  return result;
};

/**
 * Generate Universal Unique ID v4
 */
exports.generateUUID = (): string => {
  return uuidv4();
};
