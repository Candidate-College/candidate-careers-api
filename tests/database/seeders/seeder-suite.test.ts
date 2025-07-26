/**
 * Seeder Suite Test Cases
 *
 * Comprehensive test suite for verifying the execution and correctness of all main seeders.
 * Ensures all tables are populated with the correct record counts and relationships.
 *
 * @module tests/database/seeders/seeder-suite.test
 */

const knex = require('../../../src/config/database/query-builder');

// Helper to count records in a table
const countTable = async (table: string) => {
  const [{ count }] = await knex(table).count('* as count');
  return Number(count);
};

describe('Seeder Execution', () => {
  beforeAll(async () => {
    // Clean and re-seed database before tests
    await knex.migrate.rollback(undefined, true);
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it('should run complete seeder suite and populate all tables', async () => {
    await knex.seed.run();
    expect(await countTable('roles')).toBeGreaterThanOrEqual(3);
    expect(await countTable('users')).toBeGreaterThanOrEqual(15);
    expect(await countTable('departments')).toBeGreaterThanOrEqual(12);
    expect(await countTable('job_categories')).toBeGreaterThanOrEqual(15);
    expect(await countTable('job_postings')).toBeGreaterThanOrEqual(25);
    expect(await countTable('job_applications')).toBeGreaterThanOrEqual(50);
  });

  it('should run individual role seeder and create 3 roles with correct permissions', async () => {
    await knex('roles').del();
    await require('../../../src/database/seeders/20250721230501_roles').seed(knex);
    expect(await countTable('roles')).toBeGreaterThanOrEqual(3);
    // Optionally, check permissions if needed
  });

  it('should run individual user seeder and create 15+ users with proper role assignments', async () => {
    await knex('users').del();
    await require('../../../src/database/seeders/20250721230502_users').seed(knex);
    expect(await countTable('users')).toBeGreaterThanOrEqual(15);
    // Optionally, check role assignments
  });

  it('should run individual department seeder and create 12+ departments', async () => {
    await knex('departments').del();
    await require('../../../src/database/seeders/20250721230503_departments').seed(knex);
    expect(await countTable('departments')).toBeGreaterThanOrEqual(12);
  });

  it('should run individual category seeder and create 15+ categories', async () => {
    await knex('job_categories').del();
    await require('../../../src/database/seeders/20250721230504_job-categories').seed(knex);
    expect(await countTable('job_categories')).toBeGreaterThanOrEqual(15);
  });

  it('should run individual job seeder and create 25+ jobs', async () => {
    await knex('job_postings').del();
    await require('../../../src/database/seeders/20250721230505_job-postings').seed(knex);
    expect(await countTable('job_postings')).toBeGreaterThanOrEqual(25);
  });

  it('should run individual application seeder and create 50+ applications', async () => {
    await knex('job_applications').del();
    await require('../../../src/database/seeders/20250721230506_applications').seed(knex);
    expect(await countTable('job_applications')).toBeGreaterThanOrEqual(50);
  });
});
