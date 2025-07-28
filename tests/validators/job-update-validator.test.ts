/**
 * Job Update Validator Test Suite
 *
 * Tests for job update validation rules and error messages.
 *
 * @module tests/validators/job-update-validator.test
 */

import { validationResult } from 'express-validator';
import { updateJobValidator } from '../../src/validators/job-update-validator';

// Helper function to run validation
const runValidation = async (data: any) => {
  const req = { body: data };
  for (const validator of updateJobValidator) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe('Job Update Validator', () => {
  describe('Valid Data', () => {
    it('should pass validation with valid data', async () => {
      const validData = {
        title: 'Software Engineer',
        department_id: 1,
        job_category_id: 1,
        job_type: 'staff',
        employment_level: 'mid',
        priority_level: 'normal',
        description: 'We are looking for a talented software engineer to join our team. This role involves developing high-quality software solutions and collaborating with cross-functional teams.',
        requirements: 'Minimum 3 years of experience in software development. Proficiency in JavaScript, TypeScript, and Node.js.',
        responsibilities: 'Develop and maintain web applications. Collaborate with product managers and designers.',
        benefits: 'Competitive salary, health insurance, flexible working hours',
        team_info: 'Join our dynamic engineering team of 10 developers',
        application_deadline: '2025-12-31T23:59:59.000Z',
        max_applications: 100,
        version: 1
      };

      const errors = await runValidation(validData);
      expect(errors.isEmpty()).toBe(true);
    });

    it('should pass validation with minimal required data (only version)', async () => {
      const minimalData = {
        version: 1
      };

      const errors = await runValidation(minimalData);
      expect(errors.isEmpty()).toBe(true);
    });
  });

  describe('Title Validation', () => {
    it('should fail with title less than 5 characters', async () => {
      const data = { title: 'Dev', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Title must be between 5 and 255 characters');
    });

    it('should fail with title more than 255 characters', async () => {
      const longTitle = 'a'.repeat(256);
      const data = { title: longTitle, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Title must be between 5 and 255 characters');
    });

    it('should fail with non-string title', async () => {
      const data = { title: 123, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Title must be between 5 and 255 characters');
    });
  });

  describe('Department ID Validation', () => {
    it('should fail with non-integer department_id', async () => {
      const data = { department_id: 'abc', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Department ID must be a valid positive integer');
    });

    it('should fail with negative department_id', async () => {
      const data = { department_id: -1, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Department ID must be a valid positive integer');
    });
  });

  describe('Job Type Validation', () => {
    it('should fail with invalid job_type', async () => {
      const data = { job_type: 'invalid', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Job type must be one of: internship, staff, freelance, contract');
    });

    it('should pass with valid job types', async () => {
      const validTypes = ['internship', 'staff', 'freelance', 'contract'];
      
      for (const jobType of validTypes) {
        const data = { job_type: jobType, version: 1 };
        const errors = await runValidation(data);
        expect(errors.isEmpty()).toBe(true);
      }
    });
  });

  describe('Employment Level Validation', () => {
    it('should fail with invalid employment_level', async () => {
      const data = { employment_level: 'invalid', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Employment level must be one of: entry, junior, mid, senior, lead, head, co_head');
    });

    it('should pass with valid employment levels', async () => {
      const validLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'head', 'co_head'];
      
      for (const level of validLevels) {
        const data = { employment_level: level, version: 1 };
        const errors = await runValidation(data);
        expect(errors.isEmpty()).toBe(true);
      }
    });
  });

  describe('Description Validation', () => {
    it('should fail with description less than 50 characters', async () => {
      const data = { description: 'Too short', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Description must be between 50 and 10000 characters');
    });

    it('should fail with description more than 10000 characters', async () => {
      const longDescription = 'a'.repeat(10001);
      const data = { description: longDescription, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Description must be between 50 and 10000 characters');
    });
  });

  describe('Application Deadline Validation', () => {
    it('should fail with past date', async () => {
      const pastDate = '2020-01-01T00:00:00.000Z';
      const data = { application_deadline: pastDate, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Application deadline must be a future date');
    });

    it('should fail with invalid date format', async () => {
      const data = { application_deadline: 'invalid-date', version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Application deadline must be a valid ISO 8601 date');
    });

    it('should pass with future date', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      const data = { application_deadline: futureDate, version: 1 };
      const errors = await runValidation(data);
      expect(errors.isEmpty()).toBe(true);
    });
  });

  describe('Max Applications Validation', () => {
    it('should fail with max_applications less than 1', async () => {
      const data = { max_applications: 0, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Max applications must be between 1 and 10000');
    });

    it('should fail with max_applications more than 10000', async () => {
      const data = { max_applications: 10001, version: 1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Max applications must be between 1 and 10000');
    });
  });

  describe('Version Validation', () => {
    it('should fail without version', async () => {
      const data = { title: 'Software Engineer' };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Version is required and must be a positive integer for optimistic locking');
    });

    it('should fail with non-integer version', async () => {
      const data = { version: 'abc' };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Version is required and must be a positive integer for optimistic locking');
    });

    it('should fail with negative version', async () => {
      const data = { version: -1 };
      const errors = await runValidation(data);
      expect(errors.array()).toHaveLength(1);
      expect(errors.array()[0].msg).toBe('Version is required and must be a positive integer for optimistic locking');
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return multiple errors for invalid data', async () => {
      const invalidData = {
        title: 'Dev', // Too short
        job_type: 'invalid', // Invalid enum
        description: 'Short', // Too short
        version: 'abc' // Invalid type
      };

      const errors = await runValidation(invalidData);
      expect(errors.array()).toHaveLength(4); // Multiple validation errors
      
      const errorMessages = errors.array().map(error => error.msg);
      expect(errorMessages).toContain('Title must be between 5 and 255 characters');
      expect(errorMessages).toContain('Job type must be one of: internship, staff, freelance, contract');
      expect(errorMessages).toContain('Description must be between 50 and 10000 characters');
      expect(errorMessages).toContain('Version is required and must be a positive integer for optimistic locking');
    });
  });
}); 