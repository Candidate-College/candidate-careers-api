import { JobDeletionService } from '../../src/services/job-deletion-service';
import { JobPostingRepository } from '../../src/repositories/job-deletion-repository';

// Complete mock users
const mockAdminUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@example.com',
  role: { name: 'Super Admin' },
  created_at: new Date(),
  updated_at: new Date(),
};
const mockNonOwnerUser = {
  id: 2,
  name: 'NonOwner',
  email: 'nonowner@example.com',
  role: { name: 'HR Staff' },
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock JobPostingRepository
const mockRepo = {
  findJobPostingByUuid: jest.fn(),
  findWithActiveApplication: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
};

const service = new JobDeletionService(mockRepo as unknown as JobPostingRepository);

describe('JobDeletionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Deletion: Delete draft job with no applications', () => {
    it('should soft delete a draft job with no applications and return 200 status', async () => {
      // Arrange
      const job = { id: 10, created_by: 1, status: 'draft', uuid: 'draft-uuid', created_at: new Date(), updated_at: new Date() };
      mockRepo.findJobPostingByUuid.mockResolvedValueOnce(job);
      mockRepo.findWithActiveApplication.mockResolvedValue(false);
    mockRepo.softDelete.mockResolvedValueOnce(1);
      // Act
      await expect(service.deleteJobPosting('draft-uuid', mockAdminUser)).resolves.toBeUndefined();
      // Assert
      expect(mockRepo.findJobPostingByUuid).toHaveBeenCalledWith('draft-uuid');
      expect(mockRepo.findWithActiveApplication).not.toHaveBeenCalled();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('draft-uuid');
      expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
      });
  });

  describe('Successful Deletion: Delete closed job after grace period', () => {
    it('should soft delete a closed job after grace period and return 200 status', async () => {
      // Arrange
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const job = { id: 10, created_by: 1, status: 'closed', uuid: 'closed-uuid', closed_at: sevenDaysAgo, created_at: new Date(), updated_at: new Date() };
      mockRepo.findJobPostingByUuid.mockResolvedValueOnce(job);
      mockRepo.findWithActiveApplication.mockResolvedValue(false);
    mockRepo.softDelete.mockResolvedValueOnce(1);
      // Act
      await expect(service.deleteJobPosting('closed-uuid', mockAdminUser)).resolves.toBeUndefined();
      // Assert
      expect(mockRepo.findJobPostingByUuid).toHaveBeenCalledWith('closed-uuid');
      expect(mockRepo.findWithActiveApplication).not.toHaveBeenCalled();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('closed-uuid');
      expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
      });
  });

  describe('Successful Deletion: Delete job with force=true (Super Admin)', () => {
    it('should soft delete a job with force=true and return 200 status', async () => {
      // Arrange
      const job = { id: 10, created_by: 1, status: 'published', uuid: 'published-uuid', created_at: new Date(), updated_at: new Date() };
      mockRepo.findJobPostingByUuid.mockResolvedValueOnce(job);
      mockRepo.findWithActiveApplication.mockResolvedValue(true);
    mockRepo.softDelete.mockResolvedValueOnce(1);
      // Act
      await expect(service.deleteJobPosting('published-uuid', mockAdminUser, {force: true})).resolves.toBeUndefined();
      // Assert
      expect(mockRepo.findJobPostingByUuid).toHaveBeenCalledWith('published-uuid');
      expect(mockRepo.findWithActiveApplication).not.toHaveBeenCalled();
      expect(mockRepo.softDelete).toHaveBeenCalledWith('published-uuid');
      expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
      });
  });

  describe('Successful Deletion: Delete job with applications (preserve_applications=true)', () => {
    it('should soft delete the job and preserve all applications if preserveApplications=true', async () => {
      // Arrange
      const jobWithApplications = {
        id: 10,
        created_by: 1,
        status: 'published',
        uuid: 'published-uuid',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockRepo.findJobPostingByUuid.mockResolvedValueOnce(jobWithApplications);
      mockRepo.findWithActiveApplication.mockResolvedValue(true);
      mockRepo.softDelete.mockResolvedValueOnce(1);
      // Act
      await expect(service.deleteJobPosting('published-uuid', mockAdminUser, { preserveApplications: true })).resolves.toBeUndefined();
      // Assert
      expect(mockRepo.findWithActiveApplication).toHaveBeenCalledWith('published-uuid');
      expect(mockRepo.softDelete).toHaveBeenCalledWith('published-uuid');
    });
  });
});
