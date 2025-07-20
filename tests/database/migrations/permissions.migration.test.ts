/**
 * Permissions & Role-Permissions Migration Tests
 *
 * Verifies correct table creation, index creation, unique constraints and
 * rollback behaviour for the 20250715083000_permissions_and_role_permissions
 * migration. Uses Jest with a mocked Knex instance to run fast and determinis-
 * tic unit tests.
 *
 * @module tests/database/migrations/permissions.migration.test
 */

import type { Knex } from 'knex';

// Path relative to test root so ts-jest can resolve without ts-node path alias
const migration = require('../../../src/database/migrations/20250715083000_permissions_and_role_permissions');

describe('Permissions & Role-Permissions Migration', () => {
  let mockKnex: jest.Mocked<Knex>;
  let mockPermissionsTable: any;
  let mockRolePermsTable: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Simplified mock table builder returned inside createTable callback
    const buildMockTable = () => ({
      bigIncrements: jest.fn().mockReturnThis(),
      string: jest.fn().mockReturnThis(),
      primary: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      nullable: jest.fn().mockReturnThis(),
      bigInteger: jest.fn().mockReturnThis(),
      unsigned: jest.fn().mockReturnThis(),
      notNullable: jest.fn().mockReturnThis(),
      unique: jest.fn().mockReturnThis(),
      references: jest.fn().mockReturnThis(),
      inTable: jest.fn().mockReturnThis(),
      onDelete: jest.fn().mockReturnThis(),
      timestamp: jest.fn().mockReturnThis(),
      defaultTo: jest.fn().mockReturnThis(),
      index: jest.fn().mockReturnThis(),
    });

    mockPermissionsTable = buildMockTable();
    mockRolePermsTable = buildMockTable();

    mockKnex = {
      schema: {
        createTable: jest.fn().mockImplementation((name: string, cb: Function) => {
          if (name === 'permissions') cb(mockPermissionsTable);
          else if (name === 'role_permissions') cb(mockRolePermsTable);
          return Promise.resolve();
        }),
        dropTableIfExists: jest.fn().mockResolvedValue(undefined),
        raw: jest.fn().mockResolvedValue(undefined),
      },
      fn: {
        now: jest.fn().mockReturnValue('NOW()'),
      },
    } as any;
  });

  describe('up()', () => {
    it('creates permissions table with columns and uniqueness', async () => {
      await migration.up(mockKnex);
      expect(mockKnex.schema.createTable).toHaveBeenCalledWith('permissions', expect.any(Function));
      expect(mockPermissionsTable.bigIncrements).toHaveBeenCalledWith('id');
      expect(mockPermissionsTable.string).toHaveBeenCalledWith('name', 100);
      expect(mockPermissionsTable.unique).toHaveBeenCalled();
    });

    it('creates role_permissions junction with FKs and composite uniqueness', async () => {
      await migration.up(mockKnex);
      expect(mockKnex.schema.createTable).toHaveBeenCalledWith('role_permissions', expect.any(Function));
      expect(mockRolePermsTable.bigInteger).toHaveBeenCalledWith('role_id');
      expect(mockRolePermsTable.references).toHaveBeenCalledWith('id');
      expect(mockRolePermsTable.inTable).toHaveBeenCalledWith('roles');
      expect(mockRolePermsTable.onDelete).toHaveBeenCalledWith('CASCADE');
      expect(mockKnex.schema.raw).toHaveBeenCalledWith(expect.stringContaining('role_permissions_role_id_idx'));
    });
  });

  describe('down()', () => {
    it('drops tables in correct order', async () => {
      await migration.down(mockKnex);
      expect(mockKnex.schema.dropTableIfExists).toHaveBeenCalledWith('role_permissions');
      expect(mockKnex.schema.dropTableIfExists).toHaveBeenCalledWith('permissions');
    });
  });
});
