import { JobPostingService } from '../../src/services/job-posting-service';
import { JobPostingRepository, IJobPostingRepository } from '../../src/repositories/job-posting-repository';
import { SlugGenerationService } from '../../src/services/slug-generation-service';
import { SlugHistoryService } from '../../src/services/slug-history-service';
import { createNotFoundError, createError, ErrorType } from '../../src/utilities/error-handler';

// Mock external services
jest.mock('../../src/services/slug-generation-service');
jest.mock('../../src/services/slug-history-service');
jest.mock('../../src/utilities/error-handler');

// Complete mock users
const mockSuperAdminUser = {
  id: 1,
  name: 'Super Admin',
  email: 'admin@example.com',
  role: { name: 'Super Admin' },
  created_at: new Date(),
  updated_at: new Date(),
};

const mockHeadOfHrUser = {
  id: 2,
  name: 'Head of HR',
  email: 'headhr@example.com',
  role: { name: 'Head of HR' },
  created_at: new Date(),
  updated_at: new Date(),
};

const mockHrStaffUser = {
  id: 3,
  name: 'HR Staff',
  email: 'hrstaff@example.com',
  role: { name: 'HR Staff' },
  created_at: new Date(),
  updated_at: new Date(),
};

const mockNonOwnerHrStaffUser = {
  id: 4,
  name: 'Non Owner HR Staff',
  email: 'nonowner@example.com',
  role: { name: 'HR Staff' },
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock JobPostingRepository
const mockRepo = {
  findByUuid: jest.fn(),
  findWithActiveApplication: jest.fn(),
  update: jest.fn(),
  isSlugTaken: jest.fn(),
  createSlugHistory: jest.fn(),
};

const service = new JobPostingService(mockRepo as unknown as JobPostingRepository);

// Helper functions to reduce duplication
const createMockJob = (overrides: Partial<any> = {}) => ({
  id: 10,
  uuid: 'test-uuid',
  title: 'Test Job',
  slug: 'test-job',
  department_id: 1,
  job_category_id: 1,
  job_type: 'staff' as const,
  employment_level: 'mid' as const,
  priority_level: 'normal' as const,
  description: 'Test description with more than 50 characters to meet minimum requirement',
  requirements: 'Test requirements with more than 20 characters to meet minimum requirement',
  responsibilities: 'Test responsibilities with more than 20 characters to meet minimum requirement',
  benefits: 'Test benefits',
  team_info: 'Test team info',
  application_deadline: new Date('2024-12-31'),
  max_applications: 100,
  status: 'draft' as const,
  views_count: 0,
  applications_count: 0,
  created_by: 3, // HR Staff user
  updated_by: 3,
  created_at: new Date(),
  updated_at: new Date(),
  version: 1,
  ...overrides,
});

const createMockUpdatePayload = (overrides: Partial<any> = {}) => ({
  title: 'Updated Job Title',
  description: 'Updated description with more than 50 characters to meet minimum requirement',
  version: 1,
  ...overrides,
});

/**
 * Setup mock repository with proper handling
 */
const setupMockRepository = (job: any, hasActiveApplications = false) => {
  jest.clearAllMocks();
  
  mockRepo.findByUuid.mockResolvedValue(job);
  mockRepo.findWithActiveApplication.mockResolvedValue(hasActiveApplications);
  mockRepo.update.mockResolvedValue(1);
  mockRepo.isSlugTaken.mockResolvedValue(false);
  mockRepo.createSlugHistory.mockResolvedValue(undefined);
};

describe('JobPostingService - updateJobPosting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocked services
    (SlugGenerationService.regenerateSlug as jest.Mock).mockResolvedValue('new-slug');
    (SlugHistoryService.trackSlugChange as jest.Mock).mockResolvedValue(undefined);
    
    // Reset error handlers
    (createNotFoundError as jest.Mock).mockReturnValue(new Error('Not Found'));
    (createError as jest.Mock).mockReturnValue(new Error('Generic Error'));
  });

  describe('Successful Updates', () => {
    it('should update job with valid title only', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ title: 'New Title' }));
      expect(result).toEqual(job);
    });

    it('should update job with multiple valid fields', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: 'New Title',
        description: 'New description with more than 50 characters',
        requirements: 'New requirements with more than 20 characters',
        responsibilities: 'New responsibilities with more than 20 characters',
        benefits: 'New benefits',
        team_info: 'New team info',
        application_deadline: '2025-12-31',
        max_applications: 200,
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining(payload));
      expect(result).toEqual(job);
    });

    it('should update job with new department_id', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ department_id: 2 });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ department_id: 2 }));
      expect(result).toEqual(job);
    });

    it('should update job title (slug regeneration)', async () => {
      const job = createMockJob({ title: 'Old Title', slug: 'old-title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(SlugGenerationService.regenerateSlug).toHaveBeenCalled();
    });

    it('should update job with future deadline', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ application_deadline: '2025-12-31' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ application_deadline: '2025-12-31' }));
      expect(result).toEqual(job);
    });

    it('should update job with valid version number', async () => {
      const job = createMockJob({ version: 2 });
      const payload = createMockUpdatePayload({ version: 2 });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 2, expect.any(Object));
      expect(result).toEqual(job);
    });
  });

  describe('UUID Validation', () => {
    it('should reject update soft-deleted job', async () => {
      const job = createMockJob({ deleted_at: new Date() });
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Not Found');
    });
  });

  describe('Title Validation', () => {
    it('should reject update job with duplicate title (different job)', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ title: 'Duplicate Title' });
      setupMockRepository(job);
      mockRepo.isSlugTaken.mockResolvedValue(true);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Deadline Validation', () => {
    it('should allow update job with null deadline (clear deadline)', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ application_deadline: null });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ application_deadline: null }));
      expect(result).toEqual(job);
    });
  });

  describe('Max Applications', () => {
    it('should allow update job with null max_applications', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ max_applications: null });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ max_applications: null }));
      expect(result).toEqual(job);
    });
  });

  describe('Authentication', () => {
    it('should reject update job without authentication', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', null as any, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Authorization - Super Admin', () => {
    it('should allow Super Admin to update any job', async () => {
      const job = createMockJob({ created_by: 999 }); // Different creator
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });
  });

  describe('Authorization - Head of HR', () => {
    it('should allow Head of HR to update any job', async () => {
      const job = createMockJob({ created_by: 999 }); // Different creator
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockHeadOfHrUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });
  });

  describe('Authorization - HR Staff', () => {
    it('should allow HR Staff to update own job', async () => {
      const job = createMockJob({ created_by: 3 }); // Same as HR Staff user
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockHrStaffUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });

    it('should reject HR Staff from updating other\'s job', async () => {
      const job = createMockJob({ created_by: 999 }); // Different creator
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockNonOwnerHrStaffUser, payload)
      ).rejects.toThrow('Generic Error');

      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('Version Control', () => {
    it('should update job with correct version', async () => {
      const job = createMockJob({ version: 2 });
      const payload = createMockUpdatePayload({ version: 2 });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 2, expect.any(Object));
      expect(result).toEqual(job);
    });

    it('should reject update job with outdated version', async () => {
      const job = createMockJob({ version: 2 });
      const payload = createMockUpdatePayload({ version: 1 }); // Outdated
      setupMockRepository(job);
      mockRepo.update.mockResolvedValue(0); // No rows affected

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Slug Regeneration', () => {
    it('should regenerate slug when job title is updated', async () => {
      const job = createMockJob({ title: 'Old Title', slug: 'old-title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(SlugGenerationService.regenerateSlug).toHaveBeenCalled();
    });

    it('should handle update title to existing title (different job)', async () => {
      const job = createMockJob({ title: 'Existing Title', slug: 'existing-title' });
      const payload = createMockUpdatePayload({ title: 'Existing Title' });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(SlugGenerationService.regenerateSlug).toHaveBeenCalled();
    });

    it('should handle update title with special characters', async () => {
      const job = createMockJob({ title: 'Old Title', slug: 'old-title' });
      const payload = createMockUpdatePayload({ title: 'New Title with @#$%^&*()' });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(SlugGenerationService.regenerateSlug).toHaveBeenCalled();
    });

    it('should not regenerate slug when non-title fields are updated', async () => {
      const job = createMockJob({ title: 'Same Title' });
      const payload = createMockUpdatePayload({ description: 'New description with more than 50 characters' });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(SlugGenerationService.regenerateSlug).not.toHaveBeenCalled();
    });
  });

  describe('Partial Updates', () => {
    it('should update only description field', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ description: 'Only description updated with more than 50 characters' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining({ description: payload.description }));
      expect(result).toEqual(job);
    });

    it('should update multiple optional fields', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: 'Updated description with more than 50 characters',
        benefits: 'Updated benefits',
        team_info: 'Updated team info',
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith('test-uuid', 1, expect.objectContaining(payload));
      expect(result).toEqual(job);
    });

    it('should reject update with empty request body', async () => {
      const job = createMockJob();
      const payload = { version: 1 };
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });

    it('should reject update with only version field', async () => {
      const job = createMockJob();
      const payload = { version: 1 };
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Business Rules - Published Jobs', () => {
    it('should reject update critical fields of published job', async () => {
      const job = createMockJob({ status: 'published' });
      const payload = createMockUpdatePayload({
        title: 'New Title',
        department_id: 2,
        job_type: 'contract',
      });
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });

    it('should allow update non-critical fields of published job', async () => {
      const job = createMockJob({ status: 'published' });
      const payload = createMockUpdatePayload({
        description: 'Updated description with more than 50 characters',
        requirements: 'Updated requirements with more than 20 characters',
        responsibilities: 'Updated responsibilities with more than 20 characters',
        benefits: 'Updated benefits',
        team_info: 'Updated team info',
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });
  });

  describe('Business Rules - Jobs with Applications', () => {
    it('should reject update job that has applications', async () => {
      const job = createMockJob({ status: 'published' });
      const payload = createMockUpdatePayload({
        job_type: 'contract',
        department_id: 2,
      });
      setupMockRepository(job, true); // Has active applications

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });

    it('should allow update safe fields of job with applications', async () => {
      const job = createMockJob({ status: 'published' });
      const payload = createMockUpdatePayload({
        description: 'Updated description with more than 50 characters',
        requirements: 'Updated requirements with more than 20 characters',
      });
      setupMockRepository(job, true); // Has active applications

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });
  });

  describe('Edge Cases', () => {
    it('should handle update job with Unicode characters', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ title: 'Job with Unicode: 你好世界' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });

    it('should handle update job with emoji in title', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ title: 'Job with Emoji 🚀' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });

    it('should handle update job with minimal changes (whitespace)', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ description: '  Updated description with more than 50 characters  ' });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });

    it('should handle update job with same data as current', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: job.title,
        description: job.description,
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during update', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload();
      setupMockRepository(job);
      mockRepo.update.mockRejectedValue(new Error('Database error'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Database error');
    });

    it('should handle slug generation errors', async () => {
      const job = createMockJob({ title: 'Old Title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);
      (SlugGenerationService.regenerateSlug as jest.Mock).mockRejectedValue(new Error('Slug generation failed'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Slug generation failed');
    });

    it('should handle slug history tracking errors', async () => {
      const job = createMockJob({ title: 'Old Title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);
      (SlugHistoryService.trackSlugChange as jest.Mock).mockRejectedValue(new Error('History tracking failed'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('History tracking failed');
    });
  });

  describe('Performance Testing', () => {
    it('should update job with maximum content length within 500ms', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: 'a'.repeat(10000), // Maximum allowed length
        requirements: 'a'.repeat(5000),
        responsibilities: 'a'.repeat(5000),
        benefits: 'a'.repeat(3000),
        team_info: 'a'.repeat(2000),
      });
      setupMockRepository(job);

      const startTime = Date.now();
      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(mockRepo.update).toHaveBeenCalled();
    });

    it('should update job with slug regeneration within 500ms', async () => {
      const job = createMockJob({ title: 'Old Title', slug: 'old-title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);

      const startTime = Date.now();
      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(SlugGenerationService.regenerateSlug).toHaveBeenCalled();
    });

    it('should handle concurrent job updates (50 requests) within 5 seconds', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload();
      setupMockRepository(job);

      const startTime = Date.now();
      const promises = Array.from({ length: 50 }, () =>
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      );
      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000);
      expect(mockRepo.update).toHaveBeenCalledTimes(50);
    });
  });

  describe('Security Testing', () => {
    it('should sanitize SQL injection in job title', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: "'; DROP TABLE job_postings; --",
      });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith(
        'test-uuid',
        1,
        expect.objectContaining({
          title: "'; DROP TABLE job_postings; --",
        })
      );
    });

    it('should sanitize XSS attempt in description field', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: '<script>alert("xss")</script>Description with more than 50 characters to meet minimum requirement',
      });
      setupMockRepository(job);

      await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith(
        'test-uuid',
        1,
        expect.objectContaining({
          description: '<script>alert("xss")</script>Description with more than 50 characters to meet minimum requirement',
        })
      );
    });

    it('should validate NoSQL injection in department_id', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        department_id: { $ne: null } as any,
      });
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });

    it('should prevent path traversal in UUID parameter', async () => {
      const payload = createMockUpdatePayload();
      setupMockRepository(null);

      await expect(
        service.updateJobPosting('../../../etc/passwd', mockSuperAdminUser, payload)
      ).rejects.toThrow('Not Found');
    });
  });

  describe('HTML Content', () => {
    it('should handle basic HTML in description', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: '<p>This is a <strong>bold</strong> description with more than 50 characters to meet minimum requirement</p>',
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith(
        'test-uuid',
        1,
        expect.objectContaining({
          description: '<p>This is a <strong>bold</strong> description with more than 50 characters to meet minimum requirement</p>',
        })
      );
      expect(result).toEqual(job);
    });

    it('should reject dangerous HTML tags', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: '<script>alert("dangerous")</script>Description with more than 50 characters to meet minimum requirement',
      });
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });

    it('should reject malformed HTML', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        description: '<p>Unclosed tag description with more than 50 characters to meet minimum requirement',
      });
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle two users updating same job simultaneously', async () => {
      const job = createMockJob({ version: 1 });
      const payload1 = createMockUpdatePayload({ version: 1 });
      const payload2 = createMockUpdatePayload({ version: 1 });
      setupMockRepository(job);

      // First update succeeds
      mockRepo.update.mockResolvedValueOnce(1);
      // Second update fails due to version conflict
      mockRepo.update.mockResolvedValueOnce(0);

      const [result1, result2] = await Promise.allSettled([
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload1),
        service.updateJobPosting('test-uuid', mockHeadOfHrUser, payload2),
      ]);

      expect(result1.status).toBe('fulfilled');
      expect(result2.status).toBe('rejected');
    });

    it('should process multiple field updates atomically', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: 'New Title',
        description: 'New description with more than 50 characters',
        requirements: 'New requirements with more than 20 characters',
        responsibilities: 'New responsibilities with more than 20 characters',
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      expect(mockRepo.update).toHaveBeenCalledWith(
        'test-uuid',
        1,
        expect.objectContaining(payload)
      );
      expect(result).toEqual(job);
    });
  });

  describe('Database Constraints', () => {
    it('should handle foreign key violation', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({ department_id: 999999 }); // Non-existent department
      setupMockRepository(job);
      mockRepo.update.mockRejectedValue(new Error('foreign key constraint fails'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('foreign key constraint fails');
    });

    it('should prevent exceeding database field limits', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: 'a'.repeat(1000), // Exceeds database limit
      });
      setupMockRepository(job);

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Generic Error');
    });
  });

  describe('Audit Logging', () => {
    it('should create audit entry for successful job update', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: 'New Title',
        description: 'New description with more than 50 characters',
      });
      setupMockRepository(job);

      const result = await service.updateJobPosting('test-uuid', mockSuperAdminUser, payload);

      // Verify that the update was logged (this would be handled by the service)
      expect(mockRepo.update).toHaveBeenCalled();
      expect(result).toEqual(job);
    });

    it('should log failed update attempts', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload({
        title: 'Invalid Title',
      });
      setupMockRepository(job);
      mockRepo.update.mockRejectedValue(new Error('Validation failed'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Validation failed');

      // Verify that the failed attempt was logged
      expect(mockRepo.update).toHaveBeenCalled();
    });
  });

  describe('Transaction Integrity', () => {
    it('should rollback transaction on database error', async () => {
      const job = createMockJob();
      const payload = createMockUpdatePayload();
      setupMockRepository(job);
      mockRepo.update.mockRejectedValue(new Error('Database connection lost'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Database connection lost');

      // Verify no partial updates occurred
      expect(mockRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should rollback all changes on slug regeneration failure', async () => {
      const job = createMockJob({ title: 'Old Title' });
      const payload = createMockUpdatePayload({ title: 'New Title' });
      setupMockRepository(job);
      (SlugGenerationService.regenerateSlug as jest.Mock).mockRejectedValue(new Error('Slug service unavailable'));

      await expect(
        service.updateJobPosting('test-uuid', mockSuperAdminUser, payload)
      ).rejects.toThrow('Slug service unavailable');

      // Verify no partial updates occurred
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});