/**
 * RolePermission Repository
 *
 * Encapsulates write operations for linking permissions to roles via the
 * `role_permissions` junction table. Only bulk assign and single revoke are
 * required for admin APIs; read operations happen via relations in other
 * repositories.
 *
 * @module src/repositories/role-permission-repository
 */

import { transaction } from 'objection';
import { RolePermission } from '@/models/role-permission-model';

export class RolePermissionRepository {
  /**
   * Bulk assign permissions to a role.
   * Duplicates are ignored via onConflict do nothing semantics.
   */
  static async bulkAssign(roleId: number, permissionIds: number[]): Promise<number> {
    if (permissionIds.length === 0) return 0;

    // Use Objection's insertGraph? Simpler: raw insert with on conflict ignore
    const trx = await transaction.start(RolePermission.knex());
    try {
      const rows = permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid }));
      // @ts-ignore typings for onConflict not in Objection typings
      await RolePermission.query(trx)
        .insert(rows)
        .onConflict(['role_id', 'permission_id'])
        .ignore();
      await trx.commit();
      return rows.length;
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  }

  /** Revoke a single permission from a role */
  static async revoke(roleId: number, permissionId: number): Promise<number> {
    return RolePermission.query()
      .delete()
      .where({ role_id: roleId, permission_id: permissionId });
  }
}
