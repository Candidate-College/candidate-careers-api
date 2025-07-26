/**
 * Seeder Data Integrity Test Cases
 *
 * Test suite for verifying data integrity and foreign key relationships after seeding.
 * Ensures all references are valid and no orphaned records exist.
 *
 * @module tests/database/seeders/seeder-integrity.test
 */

const db = require('../../../src/config/database/query-builder');

describe('Seeder Data Integrity', () => {
  afterAll(async () => {
    await db.destroy();
  });

  it('should have valid foreign key relationships (no orphaned records)', async () => {
    // Users: role_id must exist in roles
    const invalidUserRoles = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .whereNull('roles.id');
    expect(invalidUserRoles.length).toBe(0);

    // Job postings: department_id must exist
    const invalidJobDepartments = await db('job_postings')
      .leftJoin('departments', 'job_postings.department_id', 'departments.id')
      .whereNull('departments.id');
    expect(invalidJobDepartments.length).toBe(0);

    // Job postings: job_category_id must exist
    const invalidJobCategories = await db('job_postings')
      .leftJoin('job_categories', 'job_postings.job_category_id', 'job_categories.id')
      .whereNull('job_categories.id');
    expect(invalidJobCategories.length).toBe(0);

      // Applications: job_posting_id must exist
  const invalidAppJobs = await db('job_applications')
    .leftJoin('job_postings', 'job_applications.job_posting_id', 'job_postings.id')
      .whereNull('job_postings.id');
    expect(invalidAppJobs.length).toBe(0);
  });

  it('should have all users with valid role_id references', async () => {
    const invalidUsers = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .whereNull('roles.id');
    expect(invalidUsers.length).toBe(0);
  });

  it('should have all jobs reference existing departments', async () => {
    const invalidJobs = await db('job_postings')
      .leftJoin('departments', 'job_postings.department_id', 'departments.id')
      .whereNull('departments.id');
    expect(invalidJobs.length).toBe(0);
  });

  it('should have all jobs reference existing categories', async () => {
    const invalidJobs = await db('job_postings')
      .leftJoin('job_categories', 'job_postings.job_category_id', 'job_categories.id')
      .whereNull('job_categories.id');
    expect(invalidJobs.length).toBe(0);
  });

  it('should have all applications reference existing jobs', async () => {
    const invalidApps = await db('job_applications')
      .leftJoin('job_postings', 'job_applications.job_posting_id', 'job_postings.id')
      .whereNull('job_postings.id');
    expect(invalidApps.length).toBe(0);
  });

  it('should have all users with proper email and password', async () => {
    const users = await db('users').select('email', 'password');
    for (const user of users) {
      expect(user.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
      expect(typeof user.password).toBe('string');
      expect(user.password.length).toBeGreaterThanOrEqual(8);
    }
  });
});
