/**
 * JobService
 *
 * Handles business logic for job postings, including validation, slug generation,
 * uniqueness checks, and persistence. Utilizes the JobRepository and helper services
 * for modular responsibility.
 *
 * @module services/job-service
 */

import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';
import { validateJobPosting } from '@/utilities/validate-job-posting';
import jobValidator from '@/validators/job-posting-validator';
import { randomUUID } from 'crypto';
import { SlugGenerationService } from './slug-generation-service';
import { AppError, createError, ErrorType, parseValidationError } from '@/utilities/error-handler';

/**
 * Custom error for handling inactive or invalid departments.
 * @class
 */
export class DepartmentInactiveError extends Error {
  /** Standardized application error */
  public readonly appError: AppError;

  /**
   * @param message - Error detail describing the problem with the department
   */
  constructor(message: string) {
    super(message);
    this.name = 'DepartmentInactiveError';
    this.appError = createError(ErrorType.VALIDATION_FAILED, 'Validation failed', {
      department_id: message,
    });
  }
}

/**
 * Custom error for handling inactive or invalid job categories.
 * @class
 */
export class JobCategoryInactiveError extends Error {
  /** Standardized application error */
  public readonly appError: AppError;

  /**
   * @param message - Error detail describing the problem with the job category
   */
  constructor(message: string) {
    super(message);
    this.name = 'JobCategoryInactiveError';
    this.appError = createError(ErrorType.VALIDATION_FAILED, 'Validation failed', {
      job_category_id: message,
    });
  }
}

/**
 * Custom error for handling slug generation failures.
 * @class
 */
export class SlugGenerationError extends Error {
  /** Standardized application error */
  public readonly appError: AppError;

  /**
   * @param message - General error message
   * @param errors - Optional details about the slug generation failure
   */
  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'SlugGenerationError';
    this.appError = createError(ErrorType.VALIDATION_FAILED, message, errors);
  }
}

/**
 * Service for handling job posting operations including validation, creation,
 * slug generation, and association checks with departments and categories.
 */
export class JobService {
  /**
   * Create a new job posting.
   *
   * @param rawInput - Raw data input from client or form
   * @param createdBy - ID of the user creating the job
   * @returns Promise resolving to the created Job object
   * @throws {AppError} If validation fails, or the department/category is inactive, or slug generation fails
   */
  static async createJobPosting(rawInput: Partial<Job>, createdBy: number): Promise<Job> {
    const now = new Date();
    const validationResult = validateJobPosting(rawInput, jobValidator);

    if (!validationResult.success) {
      throw parseValidationError(validationResult.errors);
    }

    const validatedData = validationResult.data;

    const isDepartmentActive = await JobRepository.isDepartmentActive(validatedData.department_id);
    if (!isDepartmentActive) {
      throw new DepartmentInactiveError('The provided Department ID is invalid or inactive');
    }

    const isCategoryActive = await JobRepository.isJobCategoryActive(validatedData.job_category_id);
    if (!isCategoryActive) {
      throw new JobCategoryInactiveError('The provided Job Category ID is invalid or inactive');
    }

    const slugResult = await SlugGenerationService.generateSlug(validatedData.title);

    if (!slugResult.isUnique || !slugResult.slug) {
      throw new SlugGenerationError('Slug Generation Failed', {
        title: slugResult.reason || 'Could not create a valid slug from the title',
      });
    }

    const uniqueSlug = await SlugGenerationService.ensureUniqueness(
      slugResult.slug,
      JobRepository.slugExists,
    );

    const processedJobData: Partial<Job> = {
      ...validatedData,
      uuid: randomUUID(),
      slug: uniqueSlug,
      description: validatedData.description,
      requirements: validatedData.requirements,
      responsibilities: validatedData.responsibilities,
      views_count: 0,
      applications_count: 0,
      priority_level: validatedData.priority_level ?? 'normal',
      status: validatedData.status ?? 'draft',
      published_at: validatedData.status === 'published' ? now : undefined,
      created_by: createdBy,
    };

    return await JobRepository.create(processedJobData);
  }
}
