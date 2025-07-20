/**
 * Permission Repository
 *
 * Central data-access layer for `permissions` table with paginated listing.
 *
 * @module src/repositories/permission-repository
 */

import { Permission, PermissionData } from '@/models/permission-model';
import { paginate, PaginationOptions, PaginatedResult } from '@/utilities/pagination';

export class PermissionRepository {
  /** Create permission */
  static async create(
    data: Omit<PermissionData, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Permission> {
    return Permission.query().insertAndFetch(data);
  }

  /** Find by id */
  static async findById(id: number): Promise<Permission | undefined> {
    return Permission.query().findById(id);
  }

  /** Paginated list with optional search */
  static async list(
    options: PaginationOptions = {},
    search?: string
  ): Promise<PaginatedResult<Permission>> {
    let qb = Permission.query().orderBy('created_at', 'desc');
    if (search) {
      qb = qb.where((builder: any) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('display_name', `%${search}%`);
      });
    }
    return paginate(qb, options);
  }

  /** Update permission */
  static async update(id: number, patch: Partial<PermissionData>): Promise<Permission | undefined> {
    return Permission.query().patchAndFetchById(id, patch);
  }

  /** Soft-delete */
  static async delete(id: number): Promise<number> {
    return Permission.query().deleteById(id);
  }
}
