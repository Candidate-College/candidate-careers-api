/**
 * RolePermissionService
 *
 * Business-logic layer for assigning/revoking roles to users and checking
 * permissions. Uses repositories/models underneath; no controller or routing
 * logic leaks into this layer.
 *
 * Key design goals:
 * – Keep file < 300 LoC (including docs).
 * – No `any` usage; return typed results.
 * – Guard-clause driven validations & informative errors.
 * – All DB writes performed inside a single transaction for atomicity.
 * – Winston logger integration for audit trail.
 *
 * @module src/services/rbac/role-permission-service
 */

import { transaction, raw } from 'objection';
import { UserRole } from '@/models/user-role-model';
import { Role } from '@/models/role-model';
import { Permission } from '@/models/permission-model';
import { defaultLogger as logger } from '@/config/logger';
import { AssignRoleResult, RevokeRoleResult } from '@/interfaces/rbac/role-permission-service';

export class RolePermissionService {
  /** Protected roles that cannot be removed from users */
  private static readonly PROTECTED_ROLE_SLUGS = ['super_admin'];

  /**
   * Assign a role to a user. Idempotent – attempting to assign a role the user
   * already has resolves successfully without error.
   */
  static async assignRole(userId: number, roleId: number): Promise<AssignRoleResult> {
    return transaction(UserRole.knex(), async trx => {
      // Validate role exists
      const role = await Role.query(trx).findById(roleId).whereNull('deleted_at');
      if (!role) {
        throw new Error('Role not found');
      }

      // Check existing assignment
      const existing = await UserRole.query(trx)
        .where({ user_id: userId, role_id: roleId })
        .first();
      if (existing) {
        logger.info('assignRole: duplicate ignored', { userId, roleId });
        return { success: true, message: 'Role already assigned' };
      }

      await UserRole.query(trx).insert({ user_id: userId, role_id: roleId });
      logger.info('assignRole: success', { userId, roleId });
      return { success: true };
    });
  }

  /**
   * Revoke a role from a user. It is a no-op if the user does not hold the
   * specified role. Revocation of protected roles is forbidden.
   */
  static async revokeRole(userId: number, roleId: number): Promise<RevokeRoleResult> {
    return transaction(UserRole.knex(), async trx => {
      const role = await Role.query(trx).findById(roleId).whereNull('deleted_at');
      if (!role) throw new Error('Role not found');

      if (this.PROTECTED_ROLE_SLUGS.includes(role.name)) {
        throw new Error('Cannot revoke protected role');
      }

      const numDeleted = await UserRole.query(trx)
        .where({ user_id: userId, role_id: roleId })
        .delete();

      logger.info('revokeRole', { userId, roleId, numDeleted });
      return { success: true, message: numDeleted ? undefined : 'Role not assigned' };
    });
  }

  /**
   * Check if a user has the given permission. Supports wildcard permission `*`
   * (super_admin role).
   */
  static async hasPermission(userId: number, permissionSlug: string): Promise<boolean> {
    // Join: users → roles → role_permissions → permissions
    const permCount = await Permission.query()
      .join('role_permissions', 'role_permissions.permission_id', 'permissions.id')
      .join('roles', 'roles.id', 'role_permissions.role_id')
      .join('users', 'users.role_id', 'roles.id')
      .where('users.id', userId)
      .where((qb: any) => {
        qb.where('permissions.name', permissionSlug).orWhere('permissions.name', '*');
      })
      .whereNull('permissions.deleted_at')
      .resultSize();

    return permCount > 0;
  }
}
