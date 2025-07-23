import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';
import { validateJobPosting } from '@/utilities/validate-job-posting';
import jobValidator from '@/validators/job-posting-validator';
import { randomUUID } from 'crypto';
import { SlugGenerationService } from './slug-generation-service';

export class JobService {
  static async createJobPosting(rawInput: Partial<Job>, createdBy: number): Promise<Job> {
    const now = new Date();

    const validationResult = validateJobPosting(rawInput, jobValidator);

    if (!validationResult.success) {
      throw { status: 422, message: 'Validation failed', errors: validationResult.errors };
    }

    const validatedData = validationResult.data;

    if (!(await JobRepository.isDepartmentActive(validatedData.department_id))) {
      throw { status: 422, message: 'The provided Department ID is invalid or inactive.' };
    }

    if (!(await JobRepository.isJobCategoryActive(validatedData.job_category_id))) {
      throw { status: 422, message: 'The provided Job Category ID is invalid or inactive.' };
    }

    const slugResult = await SlugGenerationService.generateSlug(validatedData.title);

    if (!slugResult.isUnique || !slugResult.slug) {
      throw {
        status: 422,
        message: 'Slug generation failed',
        errors: {
          title: slugResult.reason || 'Could not create a valid slug from the title.',
        },
      };
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
