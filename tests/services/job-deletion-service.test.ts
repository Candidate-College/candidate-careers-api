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

// Helper functions to reduce duplication
const createMockJob = (overrides: Partial<any> = {}) => ({
  id: 10,
  created_by: 1,
  status: 'draft',
  uuid: 'test-uuid',
  title: 'Test Job',
  applications_count: 0,
  views_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const setupMockRepository = (job: any, hasActiveApplications = false) => {
  mockRepo.findJobPostingByUuid.mockResolvedValueOnce(job);
  mockRepo.findWithActiveApplication.mockResolvedValue(hasActiveApplications);
  mockRepo.softDelete.mockResolvedValueOnce(1);
};

const verifyBasicDeletionFlow = (uuid: string, shouldCheckApplications = false) => {
  expect(mockRepo.findJobPostingByUuid).toHaveBeenCalledWith(uuid);
  if (shouldCheckApplications) {
    expect(mockRepo.findWithActiveApplication).toHaveBeenCalledWith(uuid);
  } else {
    expect(mockRepo.findWithActiveApplication).not.toHaveBeenCalled();
  }
  expect(mockRepo.softDelete).toHaveBeenCalledWith(uuid);
  expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
};

const executeDeletionTest = async (
  uuid: string,
  job: any,
  options?: any,
  hasActiveApplications = false
) => {
  setupMockRepository(job, hasActiveApplications);
  const result = await service.deleteJobPosting(uuid, mockAdminUser, options);
  verifyBasicDeletionFlow(uuid, hasActiveApplications);
  return result;
};

describe('JobDeletionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Deletion Scenarios', () => {
    it('should soft delete a draft job with no applications', async () => {
      const job = createMockJob({ status: 'draft', uuid: 'draft-uuid' });
      const result = await executeDeletionTest('draft-uuid', job);
      
      expect(result).toHaveProperty('deleted_job');
      expect(result).toHaveProperty('related_data');
      expect(result).toHaveProperty('recovery_info');
      expect(result.deleted_job.uuid).toBe('draft-uuid');
      expect(result.deleted_job.status).toBe('deleted');
    });

    it('should soft delete a closed job after grace period', async () => {
      const sevenDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
      const job = createMockJob({ 
        status: 'closed', 
        uuid: 'closed-uuid', 
        closed_at: sevenDaysAgo 
      });
      const result = await executeDeletionTest('closed-uuid', job);
      
      expect(result.deleted_job.uuid).toBe('closed-uuid');
      expect(result.deleted_job.status).toBe('deleted');
    });

    it('should soft delete a job with force=true (Super Admin)', async () => {
      const job = createMockJob({ status: 'published', uuid: 'published-uuid' });
      const result = await executeDeletionTest('published-uuid', job, { force: true });
      
      expect(result.deleted_job.uuid).toBe('published-uuid');
      expect(result.deleted_job.status).toBe('deleted');
    });

    it('should soft delete the job and preserve all applications if preserveApplications=true', async () => {
      const job = createMockJob({ 
        status: 'published', 
        uuid: 'published-uuid',
        applications_count: 15,
        views_count: 234
      });
      const result = await executeDeletionTest('published-uuid', job, { preserveApplications: true }, true);
      
      expect(result.deleted_job.uuid).toBe('published-uuid');
      expect(result.related_data.applications_preserved).toBe(15);
      expect(result.related_data.views_count_archived).toBe(234);
      expect(result.recovery_info.recovery_possible).toBe(true);
    });
  });
});
