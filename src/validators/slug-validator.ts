/**
 * Slug Validator
 *
 * Provides validation logic for slugs, including format, reserved words, profanity, and length checks.
 * Used by slug generation and update services to ensure slugs meet all requirements.
 *
 * @module src/validators/slug-validator
 */

import { RESERVED_SLUGS } from '@/constants/reserved-slugs';
import { PROFANITY_LIST } from '@/constants/profanity-list';
import {
  SLUG_REGEX,
  DEFAULT_MIN_LENGTH,
  DEFAULT_MAX_LENGTH,
} from '@/constants/slug-generation-constants';
import { SlugValidationResult } from '@/interfaces/slug/slug-generation';

function containsProfanity(str: string): boolean {
  const lower = str.toLowerCase();
  return PROFANITY_LIST.some(word => lower.includes(word));
}

function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

/**
 * Validate a slug for format, reserved words, profanity, and length.
 */
export function validateSlug(slug: string): SlugValidationResult {
  const errors: string[] = [];
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    errors.push('Slug is required');
  }
  if (slug.length < DEFAULT_MIN_LENGTH) {
    errors.push('Slug too short');
  }
  if (slug.length > DEFAULT_MAX_LENGTH) {
    errors.push('Slug too long');
  }
  if (!SLUG_REGEX.test(slug)) {
    errors.push('Slug format invalid');
  }
  if (isReservedSlug(slug)) {
    errors.push('Slug is reserved');
  }
  if (containsProfanity(slug)) {
    errors.push('Slug contains profanity');
  }
  return { isValid: errors.length === 0, errors };
}
