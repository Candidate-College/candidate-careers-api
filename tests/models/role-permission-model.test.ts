/**
 * Unit tests for RolePermission model static properties.
 */

const { RolePermission } = require('@/models/role-permission-model');

describe('RolePermission Model', () => {
  it('has correct tableName and idColumn', () => {
    expect(RolePermission.tableName).toBe('role_permissions');
    expect(RolePermission.idColumn).toBe('id');
  });

  it('does not enable softDelete', () => {
    expect(RolePermission.softDelete).toBeFalsy();
  });
});
