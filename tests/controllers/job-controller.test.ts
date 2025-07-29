import { JobController } from '@/controllers/job-controller';
import { JobResource } from '@/resources/job-posting-resource';
import { JobService } from '@/services/job-service';
import { AuthenticatedRequest, JsonResponse } from '@/types/express-extension';

jest.mock('@/services/job-service');
jest.mock('@/resources/job-posting-resource');

describe('JobController', () => {
  let req: AuthenticatedRequest;
  let res: JsonResponse;
  const mockedJobSerializeResource = JobResource.serialize as jest.Mock;
  const mockedGetJobBySlugResource = JobResource.getPublicJobBySlugResponse as jest.Mock;

  const mockedcreateJobPostingService = JobService.createJobPosting as jest.Mock;
  const mockedGetJobPostingBySlugService = JobService.getPublicJobBySlug as jest.Mock;

  const mockedGetJobByUUIDService = JobService.getJobByUUID as jest.Mock;
  const mockedJobSGetJobByUUIDResource = JobResource.getJobByUUIDResponse as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as JsonResponse;
  });

  describe('createJobPosting', () => {
    it('should return 401 Unauthorized if user is not authenticated', async () => {
      req = {
        body: {},
        user: null,
      } as unknown as AuthenticatedRequest;

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 401,
        message: 'Unauthorized. You must be logged in to create a job posting.',
      });
    });

    it('should call JobService and return 201 on successful job creation', async () => {
      const mockJobData = {
        title: 'Software Engineer',
        department_id: 1,
        job_category_id: 13,
        job_type: 'staff',
        employment_level: 'entry',
        description:
          "<script src=''>We are looking for a motivated UI Designer to join our engineering team. This role will give you hands-on experience with real-world frontend challenges and modern tools like React and TypeScript.</script>",
        requirements:
          'Basic understanding of HTML, CSS, and JavaScript. Familiarity with React is a plus. Willingness to learn and collaborate with a dynamic team.',
        responsibilities:
          'Assist in building responsive user interfaces. Collaborate with UI/UX designers. Participate in daily stand-ups and sprint reviews.',
        benefits:
          'Mentorship, flexible working hours, potential full-time offer, and team-building activities.',
        team_info:
          'You will be working closely with the Frontend Chapter led by the UI/UX Engineering Manager.',
        application_deadline: '2025-08-31T17:00:00.000Z',
        max_applications: 10000,
      };
      const userId = 123;
      const createdJob = {
        id: 72,
        uuid: 'fd58bbff-bfe1-4cfd-9a9e-4215aa3bb550',
        title: 'Software Engineer',
        slug: 'software-engineer',
        department_id: 1,
        job_category_id: 13,
        job_type: 'staff',
        employment_level: 'entry',
        priority_level: 'normal',
        description:
          "<script src=''>We are looking for a motivated UI Designer to join our engineering team. This role will give you hands-on experience with real-world frontend challenges and modern tools like React and TypeScript.</script>",
        requirements:
          'Basic understanding of HTML, CSS, and JavaScript. Familiarity with React is a plus. Willingness to learn and collaborate with a dynamic team.',
        responsibilities:
          'Assist in building responsive user interfaces. Collaborate with UI/UX designers. Participate in daily stand-ups and sprint reviews.',
        benefits:
          'Mentorship, flexible working hours, potential full-time offer, and team-building activities.',
        team_info:
          'You will be working closely with the Frontend Chapter led by the UI/UX Engineering Manager.',
        status: 'draft',
        views_count: 0,
        applications_count: 0,
        application_deadline: '2025-08-31T17:00:00.000Z',
        max_applications: 10000,
        published_at: null,
        created_by: 123,
        created_at: '2025-07-25T11:41:11.107Z',
        updated_at: '2025-07-25T11:41:11.107Z',
      };

      req = {
        body: mockJobData,
        user: { id: userId },
      } as unknown as AuthenticatedRequest;

      // --- FIX STARTS HERE ---
      // 1. Mock the service to resolve with the complete `createdJob` object.
      mockedcreateJobPostingService.mockResolvedValue(createdJob);

      // 2. Mock the resource serializer to return the final object you expect in the response.
      // In this case, the controller calls JobResource.serialize, so we mock its return value.
      mockedJobSerializeResource.mockReturnValue(createdJob);

      // 3. Call the controller method *after* all mocks are set up.
      await JobController.createJobPosting(req as any, res);

      // 4. Assert that the service and resource were called correctly.
      expect(mockedcreateJobPostingService).toHaveBeenCalledWith(mockJobData, userId);
      expect(mockedJobSerializeResource).toHaveBeenCalledWith(createdJob);

      // 5. Assert the final response.
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 201,
        message: 'Job posting created successfully',
        data: createdJob,
      });
      // --- FIX ENDS HERE ---
    });

    it('should return 422 if service throws a validation error', async () => {
      const mockAppError = {
          statusCode: 422,
          message: 'Input validation failed',
          category: 'VALIDATION',
          type: 'VALIDATION_FAILED',
          code: 'VALIDATION_VALIDATION_FAILED',
          details: {
            title: 'title must be at least 5 characters',
          },
        },
        req = {
          body: { title: 'SE' },
          user: { id: 123 },
        } as unknown as AuthenticatedRequest;

      mockedcreateJobPostingService.mockRejectedValue({ appError: mockAppError });

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 422,
        message: 'Input validation failed',
        error: {
          category: 'VALIDATION',
          type: 'VALIDATION_FAILED',
          code: 'VALIDATION_VALIDATION_FAILED',
          details: {
            title: 'title must be at least 5 characters',
          },
        },
      });
    });

    it('should return 500 for generic service errors', async () => {
      const mockGenericError = {
        statusCode: 500,
        message: 'Internal Server Error',
        category: 'INTERNAL_SERVER',
        code: 'INTERNAL_SERVER_INTERNAL_SERVER_ERROR',
        type: 'INTERNAL_SERVER_ERROR',
      };

      req = {
        body: { title: 'Valid Title' },
        user: { id: 123 },
      } as unknown as AuthenticatedRequest;

      mockedcreateJobPostingService.mockRejectedValue({ appError: mockGenericError });

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal Server Error',
        error: {
          category: 'INTERNAL_SERVER',
          code: 'INTERNAL_SERVER_INTERNAL_SERVER_ERROR',
          type: 'INTERNAL_SERVER_ERROR',
        },
      });
    });
  });

  describe('getJobPostingBySlug', () => {
    const mockPublishedJob = {
      id: 1,
      uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      title: 'Senior Software Engineer',
      slug: 'senior-software-engineer',
      department_id: 10,
      job_category_id: 20,
      job_type: 'full-time',
      employment_level: 'senior',
      priority_level: 'high',
      description:
        'A detailed description of the role focusing on building scalable web applications.',
      requirements:
        '5+ years of experience in TypeScript and Node.js. Experience with cloud services (AWS, GCP) is a plus.',
      responsibilities:
        'Develop and maintain backend services, write clean and testable code, and collaborate with frontend teams.',
      benefits:
        'Comprehensive health insurance, competitive salary, 401k matching, and unlimited paid time off.',
      team_info:
        'You will be joining the core platform team, a dynamic group responsible for the main application infrastructure.',
      status: 'published',
      views_count: 150,
      applications_count: 25,
      application_deadline: new Date('2025-12-31T23:59:59Z'),
      max_applications: 100,
      published_at: new Date('2025-01-01T12:00:00Z'),
      created_by: 5,
      created_at: new Date('2025-01-01T10:00:00Z'),
      updated_at: new Date('2025-01-02T11:00:00Z'),

      departments: [
        { name: 'Technology', description: 'The core engineering and technology department.' },
      ],
      job_categories: [{ name: 'Software Development' }],
    };
    const mockFormattedJob = {
      uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      title: 'Senior Software Engineer',
      slug: 'senior-software-engineer',
      job_type: 'full-time',
      employment_level: 'senior',
      description:
        'A detailed description of the role focusing on building scalable web applications.',
      requirements:
        '5+ years of experience in TypeScript and Node.js. Experience with cloud services (AWS, GCP) is a plus.',
      responsibilities:
        'Develop and maintain backend services, write clean and testable code, and collaborate with frontend teams.',
      benefits:
        'Comprehensive health insurance, competitive salary, 401k matching, and unlimited paid time off.',
      team_info:
        'You will be joining the core platform team, a dynamic group responsible for the main application infrastructure.',
      views_count: 150,
      application_deadline: new Date('2025-12-31T23:59:59Z'),
      max_applications: 100,
      published_at: new Date('2025-01-01T12:00:00Z'),
      // Public-safe relational data
      departments: {
        name: 'Technology',
        description: 'The core engineering and technology department.',
      },
      job_categories: { name: 'Software Development' },
    };

    beforeEach(() => {
      req = {
        params: { slug: 'senior-software-engineer' },
        query: {},
      } as unknown as AuthenticatedRequest;
    });

    it('should return a published job and status of 200 when a valid slug is provided', async () => {
      mockedGetJobPostingBySlugService.mockResolvedValue(mockPublishedJob);

      // 2. Mock what the JobResource will return as the final, formatted data.
      mockedGetJobBySlugResource.mockReturnValue(mockFormattedJob);

      // Act
      await JobController.getPublicJobBySlug(req as any, res);

      // Assert
      // 3. Check that the controller produced the correct status and JSON response.
      expect(mockedGetJobPostingBySlugService).toHaveBeenCalledWith(mockPublishedJob.slug, {
        trackView: false,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: mockFormattedJob,
      });
    });

    it('should return an error and status of 404 when the data is not found', async () => {
      const mockAppError = {
        statusCode: 404,
        message: 'Job Postings not found',
        category: 'NOT_FOUND',
        type: 'RESOURCE_NOT_FOUND',
        code: 'NOT_FOUND_RESOURCE_NOT_FOUND',
      };
      req = {
        params: { slug: 'backend-eng' },
        user: { id: 123 },
      } as unknown as AuthenticatedRequest;

      mockedcreateJobPostingService.mockRejectedValue({ appError: mockAppError });

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'Job Postings not found',
        error: {
          category: 'NOT_FOUND',
          type: 'RESOURCE_NOT_FOUND',
          code: 'NOT_FOUND_RESOURCE_NOT_FOUND',
        },
      });
    });

    it('should return an error and status of 500 for generic service error', async () => {
      const mockGenericError = {
        statusCode: 500,
        message: 'Internal Server Error',
        category: 'INTERNAL_SERVER',
        code: 'INTERNAL_SERVER_INTERNAL_SERVER_ERROR',
        type: 'INTERNAL_SERVER_ERROR',
      };

      req = {
        body: { slug: 123 },
        user: { id: 123 },
      } as unknown as AuthenticatedRequest;

      mockedcreateJobPostingService.mockRejectedValue({ appError: mockGenericError });

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: 'Internal Server Error',
        error: {
          category: 'INTERNAL_SERVER',
          code: 'INTERNAL_SERVER_INTERNAL_SERVER_ERROR',
          type: 'INTERNAL_SERVER_ERROR',
        },
      });
    });
  });

  describe('getJobByUUID', () => {
    const mockPublishedJob = {
      id: 1,
      uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
      title: 'Senior Software Engineer',
      slug: 'senior-software-engineer',
      department_id: 10,
      job_category_id: 20,
      job_type: 'full-time',
      employment_level: 'senior',
      priority_level: 'high',
      description:
        'A detailed description of the role focusing on building scalable web applications.',
      requirements:
        '5+ years of experience in TypeScript and Node.js. Experience with cloud services (AWS, GCP) is a plus.',
      responsibilities:
        'Develop and maintain backend services, write clean and testable code, and collaborate with frontend teams.',
      benefits:
        'Comprehensive health insurance, competitive salary, 401k matching, and unlimited paid time off.',
      team_info:
        'You will be joining the core platform team, a dynamic group responsible for the main application infrastructure.',
      status: 'published',
      views_count: 150,
      applications_count: 25,
      application_deadline: new Date('2025-12-31T23:59:59Z'),
      max_applications: 100,
      published_at: new Date('2025-01-01T12:00:00Z'),
      created_by: 5,
      created_at: new Date('2025-01-01T10:00:00Z'),
      updated_at: new Date('2025-01-02T11:00:00Z'),
    };
    const mockFormattedJob = mockedJobSGetJobByUUIDResource.mockResolvedValue(mockPublishedJob);

    beforeEach(() => {
      req = {
        params: { uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
        query: {},
      } as unknown as AuthenticatedRequest;
    });

    it('Should return job posting data with status of 200 if uuid is valid', async () => {
      mockedGetJobByUUIDService.mockResolvedValue(mockPublishedJob);

      mockedJobSGetJobByUUIDResource.mockReturnValue(mockFormattedJob);

      await JobController.getJobByUUID(req as any, res);

      expect(mockedGetJobByUUIDService).toHaveBeenCalledWith(mockPublishedJob.uuid, {
        trackView: false,
        include: [],
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: 'Job posting retrieved successfully',
        data: mockFormattedJob,
      });
    });

    it('should call the service with trackView=true when specified in query', async () => {
      // Arrange
      req.query = { track_view: 'true' };
      const jobWithIncrementedView = { ...mockPublishedJob, views_count: 151 };
      mockedGetJobByUUIDService.mockResolvedValue(jobWithIncrementedView as any);
      mockedJobSGetJobByUUIDResource.mockReturnValue(mockFormattedJob);

      // Act
      await JobController.getJobByUUID(req as AuthenticatedRequest, res);

      // Assert
      expect(mockedGetJobByUUIDService).toHaveBeenCalledWith(mockPublishedJob.uuid, {
        trackView: true,
        include: [],
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call the service with includes when specified in query', async () => {
      // Arrange
      req.query = { include: 'department, category' };
      const mockJobWithRelations = { ...mockPublishedJob, department: { name: 'Engineering' } };
      const mockFormattedJobWithRelations = {
        ...mockFormattedJob,
        department: { name: 'Engineering' },
      };

      mockedGetJobByUUIDService.mockResolvedValue(mockJobWithRelations as any);
      mockedJobSGetJobByUUIDResource.mockReturnValue(mockFormattedJobWithRelations);

      // Act
      await JobController.getJobByUUID(req as AuthenticatedRequest, res);

      // Assert
      expect(mockedGetJobByUUIDService).toHaveBeenCalledWith(mockPublishedJob.uuid, {
        trackView: false,
        include: ['department', 'category'],
      });
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: mockFormattedJobWithRelations }),
      );
    });
  });
});
