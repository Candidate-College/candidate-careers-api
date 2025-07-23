import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';
import { validateJobPosting } from '@/utilities/validate-job-posting';
import jobValidator from '@/validators/job-posting-validator';
import { randomUUID } from 'crypto';
import { SlugGenerationService } from './slug-generation-service';
import { parseValidationError } from '@/utilities/error-handler';

export class DepartmentInactiveError extends Error {
  public readonly status: number;
  constructor(message: string) {
    super(message);
    this.name = 'DepartmentInactiveError';
    this.status = 422;
  }
}

export class JobCategoryInactiveError extends Error {
  public readonly status: number;
  constructor(message: string) {
    super(message);
    this.name = 'JobCategoryInactiveError';
    this.status = 422;
  }
}

export class SlugGenerationError extends Error {
  public readonly status: number;
  public readonly errors?: Record<string, string>;
  constructor(message: string, errors?: Record<string, string>) {
    super(message);
    this.name = 'DepartmentInactiveError';
    this.status = 422;
    this.errors = errors;
  }
}

export class JobService {
  static async createJobPosting(rawInput: Partial<Job>, createdBy: number): Promise<Job> {
    const now = new Date();

    const validationResult = validateJobPosting(rawInput, jobValidator);

    if (!validationResult.success) {
      throw parseValidationError(validationResult.errors, 'Validation Failed');
    }

    const validatedData = validationResult.data;

    if (!(await JobRepository.isDepartmentActive(validatedData.department_id))) {
      throw new DepartmentInactiveError('The provided Department ID is invalid or inactive');
    }

    if (!(await JobRepository.isJobCategoryActive(validatedData.job_category_id))) {
      throw new JobCategoryInactiveError('The provided Job Categoryu ID is invalid or inactive');
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

    const processedJobData = {
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
