/**
 * UserRepository
 *
 * Encapsulates all DB operations related to the `users` table. This abstraction
 * keeps Objection.js specifics away from service layer and promotes easier unit
 * testing and future migrations to other ORMs.
 *
 * @module src/repositories/user-repository
 */

import { User, UserData } from '@/models/user-model';
import { QueryBuilder } from 'objection';
import { paginate, PaginatedResult } from '@/utilities/pagination';
import dayjs from 'dayjs';

export interface ListUsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
  created_from?: string; // ISO date
  created_to?: string; // ISO date
  sort_by?: 'name' | 'email' | 'created_at' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
}

export class UserRepository {
  /** Build a base query selecting allowed columns and joining roles. */
  private static baseQuery(): QueryBuilder<User, UserData[]> {
    return User.query()
      .select(
        'users.id',
        'users.uuid',
        'users.email',
        'users.name',
        'users.status',
        'users.email_verified_at',
        'users.last_login_at',
        'users.created_at',
        'users.updated_at',
        'roles.id as role:id',
        'roles.name as role:name',
        'roles.display_name as role:display_name',
      )
      .leftJoin('roles', 'roles.id', 'users.role_id');
  }

  /**
   * List users with advanced filtering, sorting, and pagination.
   */
  static async list(filters: ListUsersFilters): Promise<PaginatedResult<any>> {
    let qb = this.baseQuery();

    // Search (name, email)
    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb = qb.where(rawBuilder => {
        rawBuilder
          .whereRaw('LOWER(users.name) LIKE ?', [term])
          .orWhereRaw('LOWER(users.email) LIKE ?', [term]);
      });
    }

    // Role filter
    if (filters.role_id) {
      qb = qb.where('users.role_id', filters.role_id);
    }

    // Status filter
    if (filters.status) {
      qb = qb.where('users.status', filters.status);
    }

    // Created date range
    if (filters.created_from) {
      qb = qb.where('users.created_at', '>=', dayjs(filters.created_from).toISOString());
    }
    if (filters.created_to) {
      qb = qb.where('users.created_at', '<=', dayjs(filters.created_to).toISOString());
    }

    // Sorting
    const sortBy = filters.sort_by ?? 'created_at';
    const sortOrder = filters.sort_order ?? 'desc';
    qb = qb.orderBy(`users.${sortBy}`, sortOrder);

    return paginate(qb, { page: filters.page, pageSize: filters.limit });
  }

  /** Get single user detail by uuid with role join */
  static async findByUuid(uuid: string): Promise<UserData | undefined> {
    return this.baseQuery().where('users.uuid', uuid).first();
  }

  /**
   * Insert a single user and return the inserted record.
   */
  static async create(data: Partial<UserData>, trx?: any) {
    return trx ? User.query(trx).insertAndFetch(data) : User.query().insertAndFetch(data);
  }

  /**
   * Update a user by UUID and return the updated record.
   */
  static async updateByUuid(
    uuid: string,
    data: Partial<UserData>,
    trx?: any,
  ): Promise<UserData | undefined> {
    const query = trx ? User.query(trx) : User.query();
    return query.where('uuid', uuid).whereNull('deleted_at').patchAndFetchById(data);
  }

  /**
   * Soft delete a user by UUID.
   */
  static async deleteByUuid(uuid: string, trx?: any): Promise<number> {
    const query = trx ? User.query(trx) : User.query();
    return query.where('uuid', uuid).whereNull('deleted_at').patch({ deleted_at: new Date() });
  }

  /**
   * Hard delete a user by UUID (for permanent deletion).
   */
  static async hardDeleteByUuid(uuid: string, trx?: any): Promise<number> {
    const query = trx ? User.query(trx) : User.query();
    return query.where('uuid', uuid).delete();
  }

  /**
   * Find users by UUIDs for bulk operations.
   */
  static async findByUuids(uuids: string[], trx?: any): Promise<UserData[]> {
    const query = trx ? User.query(trx) : User.query();
    return query.whereIn('uuid', uuids).whereNull('deleted_at');
  }

  /**
   * Bulk update users by UUIDs.
   */
  static async bulkUpdateByUuids(
    uuids: string[],
    data: Partial<UserData>,
    trx?: any,
  ): Promise<number> {
    const query = trx ? User.query(trx) : User.query();
    return query.whereIn('uuid', uuids).whereNull('deleted_at').patch(data);
  }

  /**
   * Bulk soft delete users by UUIDs.
   */
  static async bulkDeleteByUuids(uuids: string[], trx?: any): Promise<number> {
    const query = trx ? User.query(trx) : User.query();
    return query.whereIn('uuid', uuids).whereNull('deleted_at').patch({ deleted_at: new Date() });
  }

  /**
   * Check if user exists and is not deleted.
   */
  static async existsByUuid(uuid: string, trx?: any): Promise<boolean> {
    const query = trx ? User.query(trx) : User.query();
    const user = await query.where('uuid', uuid).whereNull('deleted_at').first();
    return !!user;
  }

  /**
   * Get user with role details for detailed view.
   */
  static async findDetailedByUuid(uuid: string): Promise<UserData | undefined> {
    return User.query()
      .select(
        'users.*',
        'roles.id as role:id',
        'roles.name as role:name',
        'roles.display_name as role:display_name',
        'roles.description as role:description',
      )
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .where('users.uuid', uuid)
      .whereNull('users.deleted_at')
      .first();
  }
}
