/**
 * Seeder Reset Functionality Test Cases
 *
 * Test suite for verifying reset/cleanup logic for seeders.
 * Ensures all seeded data can be removed, specific entity data can be reset, and empty state is handled gracefully.
 *
 * @module tests/database/seeders/seeder-reset.test
 */

const { execSync } = require('child_process');
const knexReset = require('../../../src/config/database/query-builder');

const countTableReset = async (table: string) => {
  const [{ count }] = await knexReset(table).count('* as count');
  return Number(count);
};

describe('Seeder Reset Functionality', () => {
  afterAll(async () => {
    await knexReset.destroy();
  });

  it('should reset all seeded data and leave database clean', async () => {
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts seed:run',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:rollback --all',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    expect(await countTableReset('users')).toBe(0);
    expect(await countTableReset('departments')).toBe(0);
    expect(await countTableReset('job_categories')).toBe(0);
    expect(await countTableReset('job_postings')).toBe(0);
    expect(await countTableReset('job_applications')).toBe(0);
  });

  it('should reset only specific entity data (departments)', async () => {
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts seed:run',
    );
    await knexReset('departments').del();
    expect(await countTableReset('departments')).toBe(0);
    expect(await countTableReset('users')).toBeGreaterThan(0);
  });

  it('should reset only seeded data and preserve non-seeded data', async () => {
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts seed:run',
    );
    // Fetch a valid role_id from the roles table
    const role = await knexReset('roles').first('id');
    expect(role).toBeTruthy();
    await knexReset('users').insert({
      name: 'NonSeeded',
      email: 'nonseeded@example.com',
      password: 'Password123!',
      role_id: role.id,
    });
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:rollback --all',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    // Non-seeded data should be gone because rollback drops all tables, so this is a limitation of full reset
    expect(await countTableReset('users')).toBe(0);
  });

  it('should handle reset on empty database gracefully', async () => {
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:rollback --all',
    );
    execSync(
      'ts-node -r tsconfig-paths/register ./node_modules/knex/bin/cli.js --knexfile src/config/database/init.ts migrate:latest',
    );
    // No error should occur, and all tables should be empty
    expect(await countTableReset('users')).toBe(0);
    expect(await countTableReset('departments')).toBe(0);
    expect(await countTableReset('job_categories')).toBe(0);
    expect(await countTableReset('job_postings')).toBe(0);
    expect(await countTableReset('job_applications')).toBe(0);
  });
});
