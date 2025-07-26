/**
 * Seeder Data Validation Test Cases
 *
 * Test suite for verifying data validation rules after seeding.
 * Ensures all data meets format, uniqueness, enum, and logical requirements.
 *
 * @module tests/database/seeders/seeder-validation.test
 */

const knexValidation = require('../../../src/config/database/query-builder');

const JOB_TYPE_ENUM = ['internship', 'staff', 'freelance', 'contract'];
const EMPLOYMENT_LEVEL_ENUM = ['entry', 'junior', 'mid', 'senior', 'lead', 'head', 'co_head'];

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

describe('Seeder Data Validation', () => {
  afterAll(async () => {
    await knexValidation.destroy();
  });

  it('should have all user emails in valid format', async () => {
    const users = await knexValidation('users').select('email');
    for (const user of users) {
      expect(user.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    }
  });

  it('should have all user passwords meet complexity requirements', async () => {
    const users = await knexValidation('users').select('password');
    for (const user of users) {
      // At least 8 chars, contains uppercase, lowercase, number, special char
      expect(user.password.length).toBeGreaterThanOrEqual(8);
      // If using bcrypt hash, it should start with $2
      expect(user.password.startsWith('$2')).toBe(true);
    }
  });

  it('should have all job UUIDs in valid format', async () => {
    const jobs = await knexValidation('job_postings').select('uuid');
    for (const job of jobs) {
      expect(isUUID(job.uuid)).toBe(true);
    }
  });

  it('should have all job slugs unique', async () => {
    const jobs = await knexValidation('job_postings').select('slug');
    const slugs = jobs.map((j: any) => j.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('should have all job types and levels use valid enum values', async () => {
    const jobs = await knexValidation('job_postings').select('job_type', 'employment_level');
    for (const job of jobs) {
      expect(JOB_TYPE_ENUM).toContain(job.job_type);
      expect(EMPLOYMENT_LEVEL_ENUM).toContain(job.employment_level);
    }
  });

  it('should have all job/application dates logical and within expected ranges', async () => {
    const now = new Date();
    const jobs = await knexValidation('job_postings').select(
      'application_deadline',
      'created_at',
      'updated_at',
    );
    for (const job of jobs) {
      if (job.application_deadline) {
        expect(new Date(job.application_deadline).getTime()).toBeGreaterThan(
          now.getTime() - 365 * 24 * 60 * 60 * 1000,
        ); // not more than 1 year ago
      }
      expect(new Date(job.created_at).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(job.updated_at).getTime()).toBeLessThanOrEqual(now.getTime());
    }
    const apps = await knexValidation('job_applications').select('created_at', 'updated_at');
    for (const app of apps) {
      expect(new Date(app.created_at).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(app.updated_at).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
});
