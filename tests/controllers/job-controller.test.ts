import { JobController } from '@/controllers/job-controller';
import { JobService } from '@/services/job-service';
import { AuthenticatedRequest } from '@/types/express-extension';
import { Response } from 'express';

jest.mock('@/services/job-service');

describe('JobController', () => {
  let req: AuthenticatedRequest;
  let res: Response;
  const mockedCreateJobPosting = JobService.createJobPosting as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
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
      const jobData = { title: 'Software Engineer', department_id: 1 };
      const userId = 123;
      const createdJob = { id: 1, uuid: 'some-uuid', ...jobData };

      req = {
        body: jobData,
        user: { id: userId },
      } as unknown as AuthenticatedRequest;

      mockedCreateJobPosting.mockResolvedValue(createdJob);

      await JobController.createJobPosting(req, res);

      expect(mockedCreateJobPosting).toHaveBeenCalledWith(jobData, userId);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 201,
        message: 'Job posting created successfully',
        data: createdJob,
      });
    });

    it('should return 422 if service throws a validation error', async () => {
      const validationError = {
        status: 422,
        message: 'Validation failed',
        errors: { title: 'Title is too short' },
      };

      req = {
        body: { title: 'SE' },
        user: { id: 123 },
      } as unknown as AuthenticatedRequest;

      mockedCreateJobPosting.mockRejectedValue(validationError);

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        message: validationError.message,
        errors: validationError.errors,
      });
    });

    it('should return 500 for generic service errors', async () => {
      const genericError = new Error('Something went wrong');

      req = {
        body: { title: 'Valid Title' },
        user: { id: 123 },
      } as unknown as AuthenticatedRequest;

      mockedCreateJobPosting.mockRejectedValue(genericError);

      await JobController.createJobPosting(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Something went wrong',
        errors: undefined,
      });
    });
  });
});
