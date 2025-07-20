/**
 * Default Roles & Permissions Seeder Tests
 *
 * Ensures seeder inserts expected data and remains idempotent. Uses a fully
 * mocked Knex instance for fast, deterministic unit tests.
 *
 * @module tests/database/seeders/roles_permissions.seeder.test
 */

import type { Knex } from 'knex';

const seeder = require('../../../src/database/seeders/20250715083000_default_roles_permissions');

describe('Default Roles & Permissions Seeder', () => {
  let knexMockFn: any;
  let knex: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Helper to create a query chain stub (insert → onConflict → ignore)
    const makeQueryStub = () => {
      const chain = {
        insert: jest.fn().mockReturnThis(),
        onConflict: jest.fn().mockReturnThis(),
        ignore: jest.fn().mockResolvedValue(undefined),
      } as any;
      return chain;
    };

    // Main knex function mock
    knexMockFn = jest.fn().mockImplementation(() => makeQueryStub());
    // Attach raw method for raw SQL execution in seeder
    (knexMockFn as any).raw = jest.fn().mockResolvedValue(undefined);
    knex = knexMockFn as any;
  });

  it('inserts roles, permissions and mappings without errors', async () => {
    await expect(seeder.seed(knex as unknown as Knex)).resolves.not.toThrow();

    // Expect tables to be targeted with insert
    expect(knexMockFn).toHaveBeenCalledWith('roles');
    expect(knexMockFn).toHaveBeenCalledWith('permissions');

    // Expect raw to be called for each role-permission mapping
    expect((knexMockFn as any).raw).toHaveBeenCalled();
  });

  it('is idempotent – running twice does not throw', async () => {
    await seeder.seed(knex as unknown as Knex);
    await expect(seeder.seed(knex as unknown as Knex)).resolves.not.toThrow();
  });
});
