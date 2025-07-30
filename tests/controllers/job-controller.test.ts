import { JobController } from '@/controllers/job-controller';
import { JobResource } from '@/resources/job-posting-resource';
import { JobService } from '@/services/job-service';
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';

// --- Mocks Setup ---
jest.mock('@/services/job-service');
jest.mock('@/resources/job-posting-resource');

// --- Mocked Implementations ---
const mockedJobService = JobService as jest.Mocked<typeof JobService>;
const mockedJobResource = JobResource as jest.Mocked<typeof JobResource>;

// --- Reusable Mock Data ---
const MOCK_USER_ID = 123;
const MOCK_JOB_INPUT = { title: 'Software Engineer', department_id: 1 };
const MOCK_JOB_DB_RECORD = {
  id: 72,
  uuid: 'fd58bbff-bfe1-4cfd-9a9e-4215aa3bb550',
  slug: 'software-engineer',
  ...MOCK_JOB_INPUT,
  status: 'published',
  created_by: MOCK_USER_ID,
  // Add other required fields for a complete Job object
  job_category_id: 2,
  job_type: 'full-time',
  employment_level: 'mid',
  priority_level: 'normal',
  description: 'Job Description',
  requirements: 'Job Requirements',
  responsibilities: 'Job Responsibilities',
  benefits: 'Job Benefits',
  team_info: 'Team Info',
  views_count: 0,
  applications_count: 0,
  application_deadline: new Date(),
  max_applications: 100,
  published_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  departments: [],
  job_categories: [],
  created_by_user: undefined,
};

// A more complete mock that satisfies the return types of the resource methods
const MOCK_FORMATTED_RESPONSE = {
  id: MOCK_JOB_DB_RECORD.id,
  uuid: MOCK_JOB_DB_RECORD.uuid,
  title: MOCK_JOB_DB_RECORD.title,
  slug: MOCK_JOB_DB_RECORD.slug,
  status: MOCK_JOB_DB_RECORD.status,
  department_id: MOCK_JOB_DB_RECORD.department_id,
  job_category_id: MOCK_JOB_DB_RECORD.job_category_id,
  job_type: MOCK_JOB_DB_RECORD.job_type,
  employment_level: MOCK_JOB_DB_RECORD.employment_level,
  priority_level: MOCK_JOB_DB_RECORD.priority_level,
  description: MOCK_JOB_DB_RECORD.description,
  requirements: MOCK_JOB_DB_RECORD.requirements,
  responsibilities: MOCK_JOB_DB_RECORD.responsibilities,
  benefits: MOCK_JOB_DB_RECORD.benefits,
  team_info: MOCK_JOB_DB_RECORD.team_info,
  views_count: MOCK_JOB_DB_RECORD.views_count,
  applications_count: MOCK_JOB_DB_RECORD.applications_count,
  application_deadline: MOCK_JOB_DB_RECORD.application_deadline,
  max_applications: MOCK_JOB_DB_RECORD.max_applications,
  published_at: MOCK_JOB_DB_RECORD.published_at,
  created_by: MOCK_JOB_DB_RECORD.created_by,
  created_at: MOCK_JOB_DB_RECORD.created_at,
  updated_at: MOCK_JOB_DB_RECORD.updated_at,
  departments: MOCK_JOB_DB_RECORD.departments,
  job_categories: MOCK_JOB_DB_RECORD.job_categories,
  creator: MOCK_JOB_DB_RECORD.created_by_user,
};

describe('JobController', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: JsonResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as JsonResponse;
  });

  // --- Test Suite for createJobPosting ---
  describe('createJobPosting', () => {
    it('should return 201 on successful job creation', async () => {
      req = { body: MOCK_JOB_INPUT, user: { id: MOCK_USER_ID } };
      mockedJobService.createJobPosting.mockResolvedValue(MOCK_JOB_DB_RECORD as any);
      mockedJobResource.serialize.mockReturnValue(MOCK_FORMATTED_RESPONSE as any);

      await JobController.createJobPosting(req as AuthenticatedRequest, res);

      expect(mockedJobService.createJobPosting).toHaveBeenCalledWith(MOCK_JOB_INPUT, MOCK_USER_ID);
      expect(mockedJobResource.serialize).toHaveBeenCalledWith(MOCK_JOB_DB_RECORD);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 201,
        message: 'Job posting created successfully',
        data: MOCK_FORMATTED_RESPONSE,
      });
    });

    it('should return 401 Unauthorized if user is not authenticated', async () => {
      // FIX: user should be undefined, not null, to match the type definition
      req = { body: {}, user: undefined };
      await JobController.createJobPosting(req as AuthenticatedRequest, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
    });

    it.each([
      {
        description: 'a validation error (422)',
        error: { statusCode: 422, message: 'Validation failed', type: 'VALIDATION_FAILED' },
      },
      {
        description: 'a generic server error (500)',
        error: { statusCode: 500, message: 'Internal Server Error', type: 'INTERNAL_SERVER_ERROR' },
      },
    ])('should return $error.statusCode for $description', async ({ error }) => {
      req = { body: MOCK_JOB_INPUT, user: { id: MOCK_USER_ID } };
      mockedJobService.createJobPosting.mockRejectedValue({ appError: error });

      await JobController.createJobPosting(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(error.statusCode);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: error.statusCode }),
      );
    });
  });

  // --- Test Suite for getPublicJobBySlug ---
  describe('getPublicJobBySlug', () => {
    const slug = 'senior-software-engineer';

    it('should return 200 with formatted job data on success', async () => {
      req = { params: { slug }, query: {} };
      mockedJobService.getPublicJobBySlug.mockResolvedValue(MOCK_JOB_DB_RECORD as any);
      mockedJobResource.getPublicJobBySlugResponse.mockReturnValue(MOCK_FORMATTED_RESPONSE as any);

      await JobController.getPublicJobBySlug(req as any, res);

      expect(mockedJobService.getPublicJobBySlug).toHaveBeenCalledWith(slug, { trackView: false });
      expect(mockedJobResource.getPublicJobBySlugResponse).toHaveBeenCalledWith(MOCK_JOB_DB_RECORD);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: MOCK_FORMATTED_RESPONSE,
      });
    });

    it('should return 404 when job is not found', async () => {
      req = { params: { slug }, query: {} };
      const error = { statusCode: 404, message: 'Job not found', type: 'RESOURCE_NOT_FOUND' };
      mockedJobService.getPublicJobBySlug.mockRejectedValue({ appError: error });

      await JobController.getPublicJobBySlug(req as any, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  // --- Test Suite for getJobByUUID ---
  describe('getJobByUUID', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

    it('should return 200 with formatted job data on success', async () => {
      req = { params: { uuid }, query: {} };
      mockedJobService.getJobByUUID.mockResolvedValue(MOCK_JOB_DB_RECORD as any);
      mockedJobResource.getJobByUUIDResponse.mockReturnValue(MOCK_FORMATTED_RESPONSE as any);

      await JobController.getJobByUUID(req as AuthenticatedRequest, res);

      expect(mockedJobService.getJobByUUID).toHaveBeenCalledWith(uuid, {
        trackView: false,
        include: [],
      });
      expect(mockedJobResource.getJobByUUIDResponse).toHaveBeenCalledWith(MOCK_JOB_DB_RECORD);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: MOCK_FORMATTED_RESPONSE,
      });
    });

    it('should pass trackView and include parameters to the service', async () => {
      req = { params: { uuid }, query: { track_view: 'true', include: 'department,category' } };
      mockedJobService.getJobByUUID.mockResolvedValue(MOCK_JOB_DB_RECORD as any);

      await JobController.getJobByUUID(req as AuthenticatedRequest, res);

      expect(mockedJobService.getJobByUUID).toHaveBeenCalledWith(uuid, {
        trackView: true,
        include: ['department', 'category'],
      });
    });

    it('should return 404 when job is not found', async () => {
      req = { params: { uuid }, query: {} };
      const error = { statusCode: 404, message: 'Job not found', type: 'RESOURCE_NOT_FOUND' };
      mockedJobService.getJobByUUID.mockRejectedValue({ appError: error });

      await JobController.getJobByUUID(req as AuthenticatedRequest, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
