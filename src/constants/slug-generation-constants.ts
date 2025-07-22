/**
 * Slug Generation Constants
 *
 * Contains constants for reserved slugs, profanity filtering, slug length, regex, and stop words used in slug generation and validation.
 *
 * @module src/constants/slug-generation-constants
 */

export const RESERVED_SLUGS: string[] = [
  'admin',
  'api',
  'jobs',
  'login',
  'register',
  'dashboard',
  'settings',
  'user',
  'users',
  'search',
  'help',
  'about',
  'contact',
  'terms',
  'privacy',
];

export const PROFANITY_LIST: string[] = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'cunt',
  'piss',
  'slut',
  'whore',
];

export const DEFAULT_MAX_LENGTH = 100;
export const DEFAULT_MIN_LENGTH = 3;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const STOP_WORDS: string[] = [
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'of',
  'for',
  'on',
  'in',
  'to',
  'with',
  'by',
  'at',
  'from',
];
