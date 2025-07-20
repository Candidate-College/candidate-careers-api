/**
 * RolePermissionService unit tests
 *
 * These tests mock Objection.js static methods so that no real DB connection is
 * required. Only the business‐rule logic inside the service is verified.
 */

// @ts-nocheck

// Mock ORM to avoid initializing real knex
class MockModel {}
(MockModel as any).knex = jest.fn();
(MockModel as any).BelongsToOneRelation = 1;
(MockModel as any).HasManyRelation = 2;
(MockModel as any).query = jest.fn(() => ({ findById: jest.fn(), whereNull: jest.fn() }));

jest.mock('@/config/database/orm', () => MockModel);

// Mock Objection transaction before importing service
jest.mock('objection', () => ({
  transaction: (_: any, cb: any) => cb({}),
  raw: jest.fn(),
}));

import { RolePermissionService } from '@/services/rbac/role-permission-service';
import { UserRole } from '@/models/user-role-model';
import { Role } from '@/models/role-model';
import { Permission } from '@/models/permission-model';

jest.mock('@/models/user-role-model');
jest.mock('@/models/role-model');
jest.mock('@/models/permission-model');
jest.mock('@/models/role-permission-model');

const trxMock = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

/** Helper to reset mocks */
function resetMocks() {
  jest.clearAllMocks();
  // reset mock implementations
  Role.query.mockReturnValue({ findById: jest.fn().mockReturnValue({ whereNull: jest.fn().mockResolvedValue({ id: 1, name: 'editor' }) }) });
  UserRole.query.mockReturnValue({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(undefined),
    insert: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue(1),
  });
  Permission.query.mockReturnValue({
    joinRelated: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    resultSize: jest.fn().mockResolvedValue(1),
  });
}

beforeEach(resetMocks);

describe('RolePermissionService.assignRole', () => {
  it('inserts new UserRole when not existing', async () => {
    await RolePermissionService.assignRole(10, 5);
    expect(UserRole.query().insert).toHaveBeenCalledWith({ user_id: 10, role_id: 5 });
  });

  it('is idempotent if role already assigned', async () => {
    UserRole.query().first.mockResolvedValue({ id: 99 });
    const res = await RolePermissionService.assignRole(10, 5);
    expect(UserRole.query().insert).not.toHaveBeenCalled();
    expect(res.message).toBe('Role already assigned');
  });
});

describe('RolePermissionService.revokeRole', () => {
  it('deletes UserRole row when exists', async () => {
    await RolePermissionService.revokeRole(10, 5);
    expect(UserRole.query().delete).toHaveBeenCalled();
  });

  it('throws when attempting to revoke protected role', async () => {
    Role.query.mockReturnValue({ findById: jest.fn().mockReturnValue({ whereNull: jest.fn().mockResolvedValue({ id: 1, name: 'super_admin' }) }) });
    await expect(RolePermissionService.revokeRole(1, 1)).rejects.toThrow('Cannot revoke protected role');
  });
});

describe('RolePermissionService.hasPermission', () => {
  it('returns true when permission exists', async () => {
    const allowed = await RolePermissionService.hasPermission(10, 'users.view');
    expect(allowed).toBe(true);
  });

  it('returns false when permission not found', async () => {
    Permission.query().resultSize.mockResolvedValue(0);
    const allowed = await RolePermissionService.hasPermission(10, 'missing');
    expect(allowed).toBe(false);
  });
});
