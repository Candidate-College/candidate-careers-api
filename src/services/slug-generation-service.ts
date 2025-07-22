/**
 * Slug Generation Service
 *
 * Provides methods for generating, validating, and ensuring uniqueness of SEO-friendly slugs for job postings.
 * Handles conflict resolution, slug regeneration, and validation for both automatic and manual assignments.
 * Integrates with reserved slugs and profanity filtering, and is designed for scalability and maintainability.
 *
 * @module src/services/slug-generation-service
 */

import slugify from 'slugify';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';
import { SlugGenerationOptions, SlugGenerationResult } from '@/interfaces/slug/slug-generation';
import { v4 as uuidv4 } from 'uuid';
import {
  RESERVED_SLUGS,
  PROFANITY_LIST,
  DEFAULT_MAX_LENGTH,
  DEFAULT_MIN_LENGTH,
  STOP_WORDS,
} from '@/constants/slug-generation-constants';
import { validateSlug } from '@/validators/slug-validator';

function removeStopWords(str: string): string {
  return str
    .split(' ')
    .filter(word => !STOP_WORDS.includes(word.toLowerCase()))
    .join(' ');
}

function containsProfanity(str: string): boolean {
  const lower = str.toLowerCase();
  return PROFANITY_LIST.some(word => lower.includes(word));
}

function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

export class SlugGenerationService {
  /**
   * Generate an SEO-friendly slug from a job title with options.
   */
  public static async generateSlug(
    title: string,
    options: SlugGenerationOptions = {},
  ): Promise<SlugGenerationResult> {
    try {
      if (!title || typeof title !== 'string' || !title.trim()) {
        return { slug: '', isUnique: false, reason: 'Title is required' };
      }

      if (title.trim().length < DEFAULT_MIN_LENGTH) {
        return {
          slug: '',
          isUnique: false,
          reason: `Title must be at least ${DEFAULT_MIN_LENGTH} characters`,
        };
      }
      let base = title.trim();
      if (options.removeStopWords) {
        base = removeStopWords(base);
      }
      let slug = slugify(base, {
        lower: true,
        strict: true,
        remove: /([\u0300-\u036f])/g,
        trim: true,
      });

      slug = slug.replace(/^-+|-+$/g, '').substring(0, options.maxLength || DEFAULT_MAX_LENGTH);

      const validation = validateSlug(slug);
      if (!validation.isValid) {
        return {
          slug,
          isUnique: false,
          reason: validation.errors?.[0] || 'Slug validation failed',
        };
      }
      // Uniqueness check is handled in ensureUniqueness
      return { slug, isUnique: true };
    } catch (err) {
      logger.error('SlugGenerationService.generateSlug error', { err });
      return { slug: '', isUnique: false, reason: 'Internal error' };
    }
  }

  /**
   * Ensure slug uniqueness, resolving conflicts by appending a counter or UUID.
   * The slugExists function must be provided by the caller (repository/service layer).
   */
  public static async ensureUniqueness(
    baseSlug: string,
    slugExists: (slug: string, excludeJobId?: number | null) => Promise<boolean>,
    excludeJobId: number | null = null,
  ): Promise<string> {
    let candidateSlug = baseSlug;
    let counter = 1;
    while (await slugExists(candidateSlug, excludeJobId)) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 999) {
        candidateSlug = `${baseSlug}-${uuidv4().slice(0, 8)}`;
        break;
      }
    }
    return candidateSlug;
  }

  /**
   * Regenerate a slug for a job posting when the title changes, with history tracking.
   * The slugExists and trackSlugChange functions must be provided by the caller.
   */
  public static async regenerateSlug(
    jobId: number,
    newTitle: string,
    slugExists: (slug: string, excludeJobId?: number | null) => Promise<boolean>,
    trackSlugChange: (
      jobId: number,
      oldSlug: string,
      newSlug: string,
      reason: string,
    ) => Promise<void>,
    oldSlug: string,
  ): Promise<string> {
    const { slug, isUnique, reason } = await this.generateSlug(newTitle);
    if (!isUnique) {
      logger.warn('SlugGenerationService.regenerateSlug validation failed', { reason });
      throw new Error(reason || 'Slug validation failed');
    }
    const uniqueSlug = await this.ensureUniqueness(slug, slugExists, jobId);
    if (uniqueSlug !== oldSlug) {
      await trackSlugChange(jobId, oldSlug, uniqueSlug, 'title_update');
    }
    return uniqueSlug;
  }
}

export default SlugGenerationService;
