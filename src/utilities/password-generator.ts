/**
 * PasswordGenerator Utility
 *
 * Generates cryptographically secure random passwords adhering to platform
 * complexity rules (min 12 chars, upper, lower, digit, symbol). Extracted into
 * its own module for reuse across invites, resets, etc.
 *
 * @module src/utilities/password-generator
 */

import crypto from 'crypto';

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGIT = '23456789';
const SYMBOL = '!@#$%^&*()_+';
const ALL = UPPER + LOWER + DIGIT + SYMBOL;

export function generateSecurePassword(length = 12): string {
  const getRand = (chars: string) => chars[crypto.randomInt(0, chars.length)];
  let pwd = [getRand(UPPER), getRand(LOWER), getRand(DIGIT), getRand(SYMBOL)];
  for (let i = pwd.length; i < length; i++) pwd.push(getRand(ALL));
  return pwd.sort(() => Math.random() - 0.5).join('');
}
