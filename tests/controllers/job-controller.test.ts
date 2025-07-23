// __tests__/job-controller.test.ts

import { JobController } from '@/controllers/job-controller';
import { JobService } from '@/services/job-service';
import { AuthenticatedRequest } from '@/types/express-extension';
import { Response } from 'express';

// Mock the JobService to isolate the controller from the service layer
jest.mock('@/services/job-service');

describe('JobController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test to ensure isolation
    jest.clearAllMocks();

    // Create a mock response object
    responseJson = jest.fn();
    responseStatus = jest.fn().mockImplementation(() => ({
      json: responseJson,
    }));
    mockResponse = {
      status: responseStatus,
      json: responseJson,
    };
  });

  const mockJobPayload = {
    title: 'Senior Software Engineer',
    department_id: 1,
    job_category_id: 2,
    job_type: 'full-time',
    employment_level: 'senior',
    description: 'A great job opportunity for a skilled engineer.',
    requirements: '5+ years of experience in Node.js.',
    responsibilities: 'Develop and maintain web applications.',
  };

  const mockCreatedJob = {
    id: 1,
    uuid: 'a-unique-uuid',
    slug: 'senior-software-engineer',
    created_by: 1,
    ...mockJobPayload,
  };

  // Positive Test Case: Job Creation - Valid Data
  it('should create a job and return 201 status on success', async () => {
    // Arrange: Set up the mock request
    mockRequest = {
      body: mockJobPayload,
      user: { id: 1 }, // Mock an authenticated user
    };

    // Mock the service to return a successful creation
    (JobService.createJobPosting as jest.Mock).mockResolvedValue(mockCreatedJob);

    // Act: Call the controller method
    await JobController.createJobPosting(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    // Assert: Check if the service and response methods were called correctly
    expect(JobService.createJobPosting).toHaveBeenCalledWith(mockJobPayload, 1);
    expect(responseStatus).toHaveBeenCalledWith(201);
    expect(responseJson).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 201,
        message: 'Job posting created successfully',
        data: expect.objectContaining({ uuid: 'a-unique-uuid' }),
      }),
    );
  });

  // Failing Test Case: Authentication
  it('should return 401 Unauthorized if user is not authenticated', async () => {
    // Arrange
    mockRequest = {
      body: mockJobPayload,
      user: undefined, // No authenticated user
    };

    // Act
    await JobController.createJobPosting(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    // Assert
    expect(JobService.createJobPosting).not.toHaveBeenCalled();
    expect(responseStatus).toHaveBeenCalledWith(401);
    expect(responseJson).toHaveBeenCalledWith({
      status: 401,
      message: 'Unauthorized. You must be logged in to create a job posting.',
    });
  });

  // Failing Test Case: Validation Error from Service
  it('should return 422 if the service throws a validation error', async () => {
    // Arrange
    mockRequest = {
      body: { ...mockJobPayload, title: '' }, // Invalid data
      user: { id: 1 },
    };

    const validationError = {
      status: 422,
      message: 'Validation failed',
      errors: { title: 'Title is required' },
    };
    (JobService.createJobPosting as jest.Mock).mockRejectedValue(validationError);

    // Act
    await JobController.createJobPosting(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    // Assert
    expect(responseStatus).toHaveBeenCalledWith(422);
    expect(responseJson).toHaveBeenCalledWith({
      message: validationError.message,
      errors: validationError.errors,
    });
  });

  // Generic Error Handling
  it('should return 500 for any other unexpected errors', async () => {
    // Arrange
    mockRequest = {
      body: mockJobPayload,
      user: { id: 1 },
    };
    const genericError = new Error('Something went wrong');
    (JobService.createJobPosting as jest.Mock).mockRejectedValue(genericError);

    // Act
    await JobController.createJobPosting(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
    );

    // Assert
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith({
      message: genericError.message,
      errors: undefined,
    });
  });
});
