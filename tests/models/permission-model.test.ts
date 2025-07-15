/**
 * Unit tests for Permission model static props & relations.
 */

const { Permission } = require('@/models/permission-model');
const { Role } = require('@/models/role-model');

describe('Permission Model', () => {
  it('has correct tableName and softDelete enabled', () => {
    expect(Permission.tableName).toBe('permissions');
    expect(Permission.softDelete).toBeTruthy();
  });

  it('defines ManyToMany relation to roles', () => {
    const rel = Permission.relationMappings?.roles;
    expect(rel).toBeDefined();
    expect(rel.modelClass).toBe(Role);
    expect(rel.join.from).toBe('permissions.id');
    expect(rel.join.to).toBe('roles.id');
  });
});
