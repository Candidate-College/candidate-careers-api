/**
 * Slug Generation Interfaces
 *
 * Defines interfaces for slug generation options, results, and validation for job postings.
 * Ensures type safety and clear contracts for slug-related services.
 *
 * @module src/interfaces/slug/slug-generation
 */

export interface SlugGenerationOptions {
  maxLength?: number;
  removeStopWords?: boolean;
  customPattern?: RegExp;
  excludeJobId?: number | null;
}

export interface SlugGenerationResult {
  slug: string;
  isUnique: boolean;
  conflictResolved?: boolean;
  reason?: string;
}

export interface SlugValidationResult {
  isValid: boolean;
  errors?: string[];
}
