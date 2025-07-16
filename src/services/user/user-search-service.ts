/**
 * UserSearchService
 *
 * Provides advanced user search capabilities for the admin panel. Built on top
 * of UserRepository, but keeps search-specific logic (keyword parsing, dynamic
 * query construction, statistics, suggestions) separate from generic list
 * filtering so we can evolve them independently.
 */

import { UserRepository, ListUsersFilters } from '@/repositories/user-repository';
import { PaginatedResult } from '@/utilities/pagination';
import { raw } from 'objection';

export class UserSearchService {
  /**
   * Perform a keyword search combined with optional structured filters.
   */
  static async searchUsers(
    query: string,
    filters: Omit<ListUsersFilters, 'search'> & { limit?: number; page?: number }
  ): Promise<PaginatedResult<any>> {
    const merged: ListUsersFilters = {
      ...filters,
      search: query,
    } as any;

    return UserRepository.list(merged);
  }

  /**
   * Build dynamic search WHERE clause for raw queries when needed. Currently
   * returns Objection raw expression matching name OR email ILIKE.
   */
  static buildSearchQuery(q: string) {
    const term = `%${q.toLowerCase()}%`;
    return raw('LOWER(users.name) LIKE ? OR LOWER(users.email) LIKE ?', [term, term]);
  }

  /**
   * Very simple implementation – return top 5 distinct names/email fragments
   * that match query. Can be replaced with full-text search later.
   */
  static async getSearchSuggestions(q: string): Promise<string[]> {
    const term = `%${q.toLowerCase()}%`;
    const rows = await UserRepository['baseQuery']?.() // access protected method via cast
      .clearSelect()
      .select('users.name as suggestion')
      .whereRaw('LOWER(users.name) LIKE ?', [term])
      .orWhereRaw('LOWER(users.email) LIKE ?', [term])
      .limit(5);

    return (rows ?? []).map((r: any) => r.suggestion);
  }

  /**
   * Aggregate simple user statistics for dashboard: total, active, inactive.
   */
  static async getUserStatistics() {
    const base = (await import('@/models/user-model')).User.query();

    const [totalRes, activeRes, inactiveRes] = await Promise.all([
      base.clone().count({ total: '*' }).first(),
      base.clone().where('status', 'active').count({ total: '*' }).first(),
      base.clone().where('status', 'inactive').count({ total: '*' }).first(),
    ]);

    return {
      total: Number(totalRes?.total ?? 0),
      active: Number(activeRes?.total ?? 0),
      inactive: Number(inactiveRes?.total ?? 0),
    };
  }
}
