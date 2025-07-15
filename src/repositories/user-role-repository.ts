/**
 * UserRoleRepository
 *
 * Provides data-access helpers to bulk assign roles to a user and revoke a
 * specific role assignment. Encapsulates all DB interaction for the
 * `user_roles` junction, keeps controllers thin, and aligns with repository
 * pattern used throughout the codebase.
 *
 * @module src/repositories/user-role-repository
 */

import { transaction } from 'objection';
import { UserRole } from '@/models/user-role-model';

export class UserRoleRepository {
  /**
   * Bulk assign roles to user – ignores duplicates (idempotent).
   *
   * @param userId user id
   * @param roleIds array of role ids
   * @returns number of inserted rows
   */
  static async bulkAssign(userId: number, roleIds: number[]): Promise<number> {
    if (roleIds.length === 0) return 0;

    return transaction(UserRole.knex(), async (trx) => {
      const rows = roleIds.map((roleId) => ({ user_id: userId, role_id: roleId }));
      const inserted = await UserRole.query(trx)
        .insert(rows)
        .onConflict(['user_id', 'role_id'])
        .ignore();
      // objection returns number[] | object[] depending on dialect; resultSize() not available
      return Array.isArray(inserted) ? inserted.length : 1;
    });
  }

  /**
   * Revoke a specific role from user.
   *
   * @returns number of deleted rows
   */
  static async revoke(userId: number, roleId: number): Promise<number> {
    return UserRole.query()
      .delete()
      .where({ user_id: userId, role_id: roleId });
  }
}
