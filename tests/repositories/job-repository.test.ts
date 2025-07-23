import { Department } from '@/models/department-model';
import { JobCategory } from '@/models/job-category-model';
import { Job } from '@/models/job-model';
import { JobRepository } from '@/repositories/job-repository';

// Mock the entire models
jest.mock('@/models/job-model');
jest.mock('@/models/department-model');
jest.mock('@/models/job-category-model');

// Define mock query type
type MockQuery = {
  insert: jest.Mock;
  returning: jest.Mock;
  select: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
};

describe('JobRepository', () => {
  let mockQuery: MockQuery;

  beforeEach(() => {
    jest.clearAllMocks();
    // A generic mock for query chaining
    mockQuery = {
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      select: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      findById: jest.fn(),
    };
  });

  describe('create', () => {
    it('should call insert and returning with the provided data', async () => {
      const jobData = { title: 'Software Engineer' };
      const createdJob = { id: 1, ...jobData };

      mockQuery.returning.mockResolvedValue(createdJob);
      (Job.query as jest.Mock).mockReturnValue(mockQuery);

      const result = await JobRepository.create(jobData);

      expect(Job.query).toHaveBeenCalledTimes(1);
      expect(mockQuery.insert).toHaveBeenCalledWith(jobData);
      expect(mockQuery.returning).toHaveBeenCalledWith('*');
      expect(result).toEqual(createdJob);
    });
  });

  describe('slugExists', () => {
    it('should return true if a job with the slug is found', async () => {
      mockQuery.findOne.mockResolvedValue({ id: 1 });
      (Job.query as jest.Mock).mockReturnValue(mockQuery);

      const exists = await JobRepository.slugExists('existing-slug');

      expect(mockQuery.select).toHaveBeenCalledWith('id');
      expect(mockQuery.findOne).toHaveBeenCalledWith({ slug: 'existing-slug' });
      expect(exists).toBe(true);
    });

    it('should return false if no job with the slug is found', async () => {
      mockQuery.findOne.mockResolvedValue(undefined);
      (Job.query as jest.Mock).mockReturnValue(mockQuery);

      const exists = await JobRepository.slugExists('new-slug');

      expect(exists).toBe(false);
    });
  });

  describe('isDepartmentActive', () => {
    it('should return true for an existing, active department', async () => {
      mockQuery.findById.mockResolvedValue({ id: 1, status: 'active' });
      (Department.query as jest.Mock).mockReturnValue(mockQuery);

      const isActive = await JobRepository.isDepartmentActive(1);

      expect(Department.query).toHaveBeenCalledTimes(1);
      expect(mockQuery.findById).toHaveBeenCalledWith(1);
      expect(isActive).toBe(true);
    });

    it('should return false for an inactive department', async () => {
      mockQuery.findById.mockResolvedValue({ id: 1, status: 'inactive' });
      (Department.query as jest.Mock).mockReturnValue(mockQuery);

      const isActive = await JobRepository.isDepartmentActive(1);

      expect(isActive).toBe(false);
    });

    it('should return false for a non-existent department', async () => {
      mockQuery.findById.mockResolvedValue(undefined);
      (Department.query as jest.Mock).mockReturnValue(mockQuery);

      const isActive = await JobRepository.isDepartmentActive(999);

      expect(isActive).toBe(false);
    });
  });

  describe('isJobCategoryActive', () => {
    it('should return true for an existing, active category', async () => {
      mockQuery.findById.mockResolvedValue({ id: 2, status: 'active' });
      (JobCategory.query as jest.Mock).mockReturnValue(mockQuery);

      const isActive = await JobRepository.isJobCategoryActive(2);

      expect(JobCategory.query).toHaveBeenCalledTimes(1);
      expect(mockQuery.findById).toHaveBeenCalledWith(2);
      expect(isActive).toBe(true);
    });

    it('should return false for a non-existent category', async () => {
      mockQuery.findById.mockResolvedValue(undefined);
      (JobCategory.query as jest.Mock).mockReturnValue(mockQuery);

      const isActive = await JobRepository.isJobCategoryActive(999);

      expect(isActive).toBe(false);
    });
  });
});
