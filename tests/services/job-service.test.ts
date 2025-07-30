import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';
import {
  DepartmentInactiveError,
  JobCategoryInactiveError,
  JobService,
  SlugGenerationError,
} from '@/services/job-service';
import { SlugGenerationService } from '@/services/slug-generation-service';
import { validateJobPosting } from '@/utilities/validate-job-posting';
import { randomUUID } from 'crypto';

// --- Mocks Setup ---
jest.mock('crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/repositories/job-repository');
jest.mock('@/services/slug-generation-service');
jest.mock('@/utilities/validate-job-posting');

const mockedRandomUUID = randomUUID as jest.Mock;
const mockedJobRepo = JobRepository as jest.Mocked<typeof JobRepository>;
const mockedSlugSvc = SlugGenerationService as jest.Mocked<typeof SlugGenerationService>;
const mockedValidate = validateJobPosting as jest.Mock;

// --- Main Test Suite ---
describe('JobService', () => {
  const NOW = new Date('2025-07-23T12:00:00.000Z');
  const CREATED_BY = 42;
  const UUID = 'uuid-1234';
  const BASE_INPUT: Partial<Job> = {
    title: 'Senior Software Engineer',
    description: 'A detailed job description.',
    requirements: 'Experience with modern JavaScript frameworks.',
    responsibilities: 'Designing and implementing frontend features.',
    department_id: 1,
    job_category_id: 2,
    job_type: 'staff',
    employment_level: 'senior',
  };

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.clearAllMocks();
    mockedRandomUUID.mockReturnValue(UUID);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --- Test Suite for createJobPosting ---
  describe('createJobPosting', () => {
    beforeEach(() => {
      // Common setup for successful path
      mockedJobRepo.isDepartmentActive.mockResolvedValue(true);
      mockedJobRepo.isJobCategoryActive.mockResolvedValue(true);
      mockedSlugSvc.generateSlug.mockResolvedValue({
        isUnique: true,
        slug: 'senior-software-engineer',
      });
      mockedSlugSvc.ensureUniqueness.mockImplementation(async s => s);
      mockedJobRepo.create.mockImplementation(async data => data as Job);
    });

    it('creates a job successfully with defaults when valid', async () => {
      mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });

      await JobService.createJobPosting(BASE_INPUT, CREATED_BY);

      expect(mockedJobRepo.create).toHaveBeenCalledWith({
        ...BASE_INPUT,
        uuid: UUID,
        slug: 'senior-software-engineer',
        views_count: 0,
        applications_count: 0,
        priority_level: 'normal',
        status: 'draft',
        published_at: undefined,
        created_by: CREATED_BY,
      });
    });

    it('respects provided status and priority_level, setting published_at for "published" status', async () => {
      const input = {
        ...BASE_INPUT,
        status: 'published' as const,
        priority_level: 'urgent' as const,
      };
      mockedValidate.mockReturnValue({ success: true, data: input });

      await JobService.createJobPosting(input, CREATED_BY);

      expect(mockedJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          priority_level: 'urgent',
          published_at: NOW,
        }),
      );
    });

    // --- Error Handling Tests ---

    // Test for direct validation failure (which throws a flat error object)
    it('throws a 422 error when validation fails (e.g., HTML in title)', async () => {
      const errors = { title: 'title must not contain HTML tags' };
      mockedValidate.mockReturnValue({ success: false, errors });

      const promise = JobService.createJobPosting(BASE_INPUT, CREATED_BY);

      // Assert that the rejected object itself matches the expected structure
      await expect(promise).rejects.toMatchObject({
        type: 'VALIDATION_FAILED',
        details: errors,
      });
    });

    // Consolidated tests for custom errors (which have a nested .appError property)
    const customErrorTestCases = [
      {
        description: 'department is inactive',
        setup: () => mockedJobRepo.isDepartmentActive.mockResolvedValue(false),
        expectedError: {
          type: 'VALIDATION_FAILED',
          details: { department_id: 'The provided Department ID is invalid or inactive' },
        },
        expectedInstance: DepartmentInactiveError,
      },
      {
        description: 'job category is inactive',
        setup: () => mockedJobRepo.isJobCategoryActive.mockResolvedValue(false),
        expectedError: {
          type: 'VALIDATION_FAILED',
          details: { job_category_id: 'The provided Job Category ID is invalid or inactive' },
        },
        expectedInstance: JobCategoryInactiveError,
      },
      {
        description: 'slug generation fails',
        setup: () =>
          mockedSlugSvc.generateSlug.mockResolvedValue({
            isUnique: false,
            slug: '',
            reason: 'invalid characters',
          }),
        expectedError: {
          type: 'VALIDATION_FAILED',
          details: { title: 'invalid characters' },
        },
        expectedInstance: SlugGenerationError,
      },
    ];

    it.each(customErrorTestCases)(
      'throws a 422 error when $description',
      async ({ setup, expectedError, expectedInstance }) => {
        // For these cases, validation must pass first.
        mockedValidate.mockReturnValue({ success: true, data: BASE_INPUT });
        setup();

        const promise = JobService.createJobPosting(BASE_INPUT, CREATED_BY);

        // Assert that the rejected object has an 'appError' property that matches
        await expect(promise).rejects.toHaveProperty(
          'appError',
          expect.objectContaining(expectedError),
        );

        await expect(promise).rejects.toBeInstanceOf(expectedInstance);
      },
    );
  });

  // --- Test Suite for getPublicJobBySlug ---
  describe('getPublicJobBySlug', () => {
    const MOCK_SLUG = 'exists-slug';
    const MOCK_JOB = {
      id: 123,
      title: 'Frontend Developer',
      slug: MOCK_SLUG,
      views_count: 100,
    };

    it('should return job data if slug is valid', async () => {
      mockedJobRepo.findPublicJobBySlug.mockResolvedValue(MOCK_JOB as Job);
      const result = await JobService.getPublicJobBySlug(MOCK_SLUG);
      expect(result).toEqual(MOCK_JOB);
    });

    it('should throw a 404 error if job is not found', async () => {
      mockedJobRepo.findPublicJobBySlug.mockResolvedValue(null);
      await expect(JobService.getPublicJobBySlug('non-exist-slug')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job Postings not found',
      });
    });

    it('should increment view count when trackView is true', async () => {
      mockedJobRepo.findPublicJobBySlug.mockResolvedValue({ ...MOCK_JOB } as Job);
      const result = await JobService.getPublicJobBySlug(MOCK_SLUG, { trackView: true });
      expect(mockedJobRepo.incrementViewCount).toHaveBeenCalledWith(MOCK_JOB.id);
      expect(result.views_count).toBe(101);
    });

    it.each([
      { options: { trackView: false }, case: 'explicitly false' },
      { options: {}, case: 'not provided (defaults to false)' },
    ])('should NOT increment view count when trackView is $case', async ({ options }) => {
      mockedJobRepo.findPublicJobBySlug.mockResolvedValue({ ...MOCK_JOB } as Job);
      const result = await JobService.getPublicJobBySlug(MOCK_SLUG, options);
      expect(mockedJobRepo.incrementViewCount).not.toHaveBeenCalled();
      expect(result.views_count).toBe(100);
    });
  });

  // --- Test Suite for getJobByUUID ---
  describe('getJobByUUID', () => {
    const MOCK_UUID = 'b732a252-5172-4b54-ba3e-b6250865c555';
    const MOCK_JOB = { id: 1, uuid: MOCK_UUID, title: 'Test Job', views_count: 100 };

    it('should return the job posting if UUID is valid', async () => {
      mockedJobRepo.findJobByUUID.mockResolvedValue(MOCK_JOB as Job);
      const result = await JobService.getJobByUUID(MOCK_UUID);
      expect(result).toEqual(MOCK_JOB);
      expect(mockedJobRepo.findJobByUUID).toHaveBeenCalledWith(MOCK_UUID, []);
    });

    it('should throw a 404 error if job is not found', async () => {
      mockedJobRepo.findJobByUUID.mockResolvedValue(null);
      await expect(JobService.getJobByUUID('non-exist-uuid')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Job Postings not found',
      });
    });

    it('should increment view count when trackView is true', async () => {
      mockedJobRepo.findJobByUUID.mockResolvedValue({ ...MOCK_JOB } as Job);
      const result = await JobService.getJobByUUID(MOCK_UUID, { trackView: true });
      expect(mockedJobRepo.incrementViewCount).toHaveBeenCalledWith(MOCK_JOB.id);
      expect(result.views_count).toBe(101);
    });

    it.each([
      { options: { trackView: false }, case: 'explicitly false' },
      { options: {}, case: 'not provided (defaults to false)' },
    ])('should NOT increment view count when trackView is $case', async ({ options }) => {
      mockedJobRepo.findJobByUUID.mockResolvedValue({ ...MOCK_JOB } as Job);
      const result = await JobService.getJobByUUID(MOCK_UUID, options);
      expect(mockedJobRepo.incrementViewCount).not.toHaveBeenCalled();
      expect(result.views_count).toBe(100);
    });

    it.each([
      { name: 'department', include: ['department'] },
      { name: 'all relations', include: ['department', 'category', 'creator'] },
    ])('should call repository with correct options to include $name', async ({ include }) => {
      mockedJobRepo.findJobByUUID.mockResolvedValue(MOCK_JOB as Job);
      await JobService.getJobByUUID(MOCK_UUID, { include });
      expect(mockedJobRepo.findJobByUUID).toHaveBeenCalledWith(MOCK_UUID, include);
    });
  });
});
