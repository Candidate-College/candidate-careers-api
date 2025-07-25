import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';
import { JobService } from '@/services/job-service';
import { SlugGenerationService } from '@/services/slug-generation-service';
import { validateJobPosting } from '@/utilities/validate-job-posting';
import jobValidator from '@/validators/job-posting-validator';
import { randomUUID } from 'crypto';

jest.mock('crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/repositories/job-repository', () => ({
  JobRepository: {
    isDepartmentActive: jest.fn(),
    isJobCategoryActive: jest.fn(),
    slugExists: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('@/services/slug-generation-service', () => ({
  SlugGenerationService: {
    generateSlug: jest.fn(),
    ensureUniqueness: jest.fn(),
  },
}));
jest.mock('@/utilities/validate-job-posting', () => ({
  validateJobPosting: jest.fn(),
}));

const mockedRandomUUID = randomUUID as jest.Mock;
const mockedJobRepo = JobRepository as jest.Mocked<typeof JobRepository>;
const mockedSlugSvc = SlugGenerationService as jest.Mocked<typeof SlugGenerationService>;
const mockedValidate = validateJobPosting as jest.Mock;

describe('JobService.createJobPosting', () => {
  const NOW = new Date('2025-07-23T12:00:00.000Z');
  const CREATED_BY = 42;
  const UUID = 'uuid-1234';
  const BASE_INPUT: Partial<Job> = {
    title: 'Senior Software Engineer',
    description:
      'A detailed job description that meets the minimum length requirements for validation testing purposes.',
    requirements: 'Must have experience with modern JavaScript frameworks.',
    responsibilities: 'Responsible for designing and implementing frontend features.',
    department_id: 1,
    job_category_id: 2,
    job_type: 'staff',
    employment_level: 'senior',
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.clearAllMocks();

    mockedRandomUUID.mockReturnValue(UUID);
    mockedJobRepo.isDepartmentActive.mockResolvedValue(true);
    mockedJobRepo.isJobCategoryActive.mockResolvedValue(true);
    mockedSlugSvc.generateSlug.mockResolvedValue({
      isUnique: true,
      slug: 'senior-software-engineer',
    });
    mockedSlugSvc.ensureUniqueness.mockImplementation(async s => s);

    mockedJobRepo.create.mockResolvedValue({
      id: 123,
      ...BASE_INPUT,
      uuid: UUID,
      slug: 'senior-software-engineer',
      views_count: 0,
      applications_count: 0,
      priority_level: 'normal',
      status: 'draft',
      published_at: undefined,
      created_by: CREATED_BY,
    } as Job);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws 422 when validation fails (e.g. HTML in title)', async () => {
    const errors = { title: 'title must not contain HTML tags' };
    mockedValidate.mockReturnValue({ success: false, errors });

    try {
      await JobService.createJobPosting({ ...BASE_INPUT, title: '<b>Bad</b>' }, CREATED_BY);
      fail('Expected error not thrown');
    } catch (err: any) {
      expect(err).toMatchObject({
        type: 'VALIDATION_FAILED',
        message: 'Input validation failed',
        details: errors,
        statusCode: 422,
      });
    }
    expect(mockedValidate).toHaveBeenCalledWith(expect.any(Object), jobValidator);
  });

  it('creates a job successfully with defaults when valid', async () => {
    mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });

    const result = await JobService.createJobPosting(BASE_INPUT, CREATED_BY);

    expect(mockedJobRepo.create).toHaveBeenCalledWith({
      ...BASE_INPUT,
      uuid: UUID,
      slug: 'senior-software-engineer',
      description: BASE_INPUT.description,
      requirements: BASE_INPUT.requirements,
      responsibilities: BASE_INPUT.responsibilities,
      views_count: 0,
      applications_count: 0,
      priority_level: 'normal',
      status: 'draft',
      published_at: undefined,
      created_by: CREATED_BY,
    });
    expect(result).toBeDefined();
  });

  it('respects provided status and priority_level', async () => {
    const input = {
      ...BASE_INPUT,
      status: 'published' as const,
      priority_level: 'urgent' as const,
    };
    mockedValidate.mockReturnValue({ success: true, data: input });

    const result = await JobService.createJobPosting(input, CREATED_BY);

    expect(mockedJobRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        priority_level: 'urgent',
        published_at: NOW,
      }),
    );
    expect(result).toBeDefined();
  });

  it('throws 422 for inactive department', async () => {
    mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });
    mockedJobRepo.isDepartmentActive.mockResolvedValue(false);

    try {
      await JobService.createJobPosting(BASE_INPUT, CREATED_BY);
      fail('Expected DepartmentInactiveError not thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(JobService.DepartmentInactiveError);
      expect(err.appError).toMatchObject({
        type: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: { department_id: 'The provided Department ID is invalid or inactive' },
        statusCode: 422,
      });
    }
  });

  it('throws 422 for inactive job category', async () => {
    mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });
    mockedJobRepo.isJobCategoryActive.mockResolvedValue(false);

    try {
      await JobService.createJobPosting(BASE_INPUT, CREATED_BY);
      fail('Expected JobCategoryInactiveError not thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(JobService.JobCategoryInactiveError);
      expect(err.appError).toMatchObject({
        type: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: { job_category_id: 'The provided Job Category ID is invalid or inactive' },
        statusCode: 422,
      });
    }
  });

  it('throws 422 when slug generation fails', async () => {
    mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });
    mockedSlugSvc.generateSlug.mockResolvedValue({
      isUnique: false,
      slug: '',
      reason: 'invalid characters',
    });

    try {
      await JobService.createJobPosting(BASE_INPUT, CREATED_BY);
      fail('Expected SlugGenerationError not thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(JobService.SlugGenerationError);
      expect(err.appError).toMatchObject({
        type: 'VALIDATION_FAILED',
        message: 'Slug Generation Failed',
        details: { title: 'invalid characters' },
        statusCode: 422,
      });
    }
  });

  it('allows emoji in title (edge case)', async () => {
    const emojiInput = { ...BASE_INPUT, title: 'Engineer 🚀' };
    mockedValidate.mockReturnValue({ success: true, data: emojiInput });

    const result = await JobService.createJobPosting(emojiInput, CREATED_BY);

    expect(mockedSlugSvc.generateSlug).toHaveBeenCalledWith('Engineer 🚀');
    expect(result).toBeDefined();
  });

  it('rejects <script> in description', async () => {
    const badDesc = '<script>alert("x")</script>' + 'A'.repeat(60);
    const errors = { description: 'description must not contain script tags' };
    mockedValidate.mockReturnValue({
      success: false,
      errors: errors,
    });

    try {
      await JobService.createJobPosting({ ...BASE_INPUT, description: badDesc }, CREATED_BY);
      fail('Expected validation error not thrown');
    } catch (err: any) {
      // ✅ FIX: Check the 'err' object directly, just like in the test that passed.
      expect(err).toMatchObject({
        type: 'VALIDATION_FAILED',
        message: 'Input validation failed',
        details: errors,
        statusCode: 422,
      });
    }
  });
});
