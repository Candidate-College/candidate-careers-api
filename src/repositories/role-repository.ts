/**
 * Role Repository
 *
 * Encapsulates CRUD operations for the `roles` table and exposes a generic
 * paginated list method that utilises the shared `paginate` utility. Keeping
 * domain data-access in dedicated repositories makes the service layer easier
 * to test and swap out if we ever migrate away from Objection.
 *
 * @module src/repositories/role-repository
 */

import { Role, RoleData } from '@/models/role-model';
import { paginate, PaginationOptions, PaginatedResult } from '@/utilities/pagination';

export class RoleRepository {
  /** Create a new role */
  static async create(data: Omit<RoleData, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    return Role.query().insertAndFetch(data);
  }

  /** Find a role by primary key */
  static async findById(id: number): Promise<Role | undefined> {
    return Role.query().findById(id);
  }

  /**
   * Paginated list of roles with optional search term.
   *
   * @param search Optional case-insensitive search on name or display_name
   */
  static async list(
    options: PaginationOptions = {},
    search?: string
  ): Promise<PaginatedResult<Role>> {
    let qb = Role.query().orderBy('created_at', 'desc');

    if (search) {
      qb = qb.where((builder: any) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('display_name', `%${search}%`);
      });
    }

    return paginate<Role>(qb, options);
  }

  /** Update a role and return the updated entity */
  static async update(id: number, patch: Partial<RoleData>): Promise<Role | undefined> {
    return Role.query().patchAndFetchById(id, patch);
  }

  /** Soft-delete a role (sets deleted_at) */
  static async delete(id: number): Promise<number> {
    return Role.query().deleteById(id);
  }
}
