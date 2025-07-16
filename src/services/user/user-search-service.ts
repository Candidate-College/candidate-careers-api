/**
 * UserSearchService
 *
 * Provides advanced user search functionality with multiple criteria,
 * filtering, and search suggestions for the admin interface.
 *
 * @module src/services/user/user-search-service
 */

import { PaginatedResult } from '@/utilities/pagination';
import { QueryBuilder } from 'objection';
import { User, UserData } from '@/models/user-model';
import dayjs from 'dayjs';

export interface SearchUsersFilters {
  q?: string;
  page?: number;
  limit?: number;
  role_ids?: number[];
  statuses?: ('active' | 'inactive' | 'suspended')[];
  email_domain?: string;
  created_after?: string;
  created_before?: string;
  last_login_after?: string;
  last_login_before?: string;
  has_verified_email?: boolean;
  login_attempts_greater_than?: number;
  include_deleted?: boolean;
  exact_match?: boolean;
  sort_by?: 'name' | 'email' | 'created_at' | 'last_login_at' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface SearchSuggestion {
  value: string;
  type: 'name' | 'email' | 'domain';
  count: number;
}

export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  suspended_users: number;
  verified_users: number;
  users_by_role: Array<{ role_name: string; count: number }>;
  recent_signups: number;
  avg_login_frequency: number;
}

export class UserSearchService {
  /**
   * Advanced user search with multiple criteria and filtering
   */
  static async searchUsers(filters: SearchUsersFilters): Promise<PaginatedResult<any>> {
    let query = this.buildSearchQuery(filters);
    return this.paginateQuery(query, filters);
  }

  /**
   * Helper to apply text search filter
   */
  private static applyTextSearch(
    query: QueryBuilder<User, UserData[]>,
    filters: SearchUsersFilters,
  ): QueryBuilder<User, UserData[]> {
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase();
      if (filters.exact_match) {
        query = query.where((rawBuilder: any) => {
          rawBuilder
            .whereRaw('LOWER(users.name) = ?', [searchTerm])
            .orWhereRaw('LOWER(users.email) = ?', [searchTerm]);
        });
      } else {
        query = query.where((rawBuilder: any) => {
          rawBuilder
            .whereRaw('LOWER(users.name) LIKE ?', [`%${searchTerm}%`])
            .orWhereRaw('LOWER(users.email) LIKE ?', [`%${searchTerm}%`]);
        });
      }
    }
    return query;
  }

  /**
   * Helper to apply role, status, and domain filters
   */
  private static applyRoleStatusDomainFilters(
    query: QueryBuilder<User, UserData[]>,
    filters: SearchUsersFilters,
  ): QueryBuilder<User, UserData[]> {
    if (filters.role_ids && filters.role_ids.length > 0) {
      query = query.whereIn('users.role_id', filters.role_ids);
    }
    if (filters.statuses && filters.statuses.length > 0) {
      query = query.whereIn('users.status', filters.statuses);
    }
    if (filters.email_domain) {
      query = query.whereRaw('LOWER(users.email) LIKE ?', [
        `%@${filters.email_domain.toLowerCase()}%`,
      ]);
    }
    return query;
  }

  /**
   * Helper to apply date and login filters
   */
  private static applyDateAndLoginFilters(
    query: QueryBuilder<User, UserData[]>,
    filters: SearchUsersFilters,
  ): QueryBuilder<User, UserData[]> {
    if (filters.created_after) {
      query = query.where('users.created_at', '>=', dayjs(filters.created_after).toISOString());
    }
    if (filters.created_before) {
      query = query.where('users.created_at', '<=', dayjs(filters.created_before).toISOString());
    }
    if (filters.last_login_after) {
      query = query.where(
        'users.last_login_at',
        '>=',
        dayjs(filters.last_login_after).toISOString(),
      );
    }
    if (filters.last_login_before) {
      query = query.where(
        'users.last_login_at',
        '<=',
        dayjs(filters.last_login_before).toISOString(),
      );
    }
    if (filters.has_verified_email !== undefined) {
      if (filters.has_verified_email) {
        query = query.whereNotNull('users.email_verified_at');
      } else {
        query = query.whereNull('users.email_verified_at');
      }
    }
    if (filters.login_attempts_greater_than !== undefined) {
      query = query.where('users.login_attempts', '>', filters.login_attempts_greater_than);
    }
    return query;
  }

  /**
   * Build complex search query based on filters
   */
  private static buildSearchQuery(filters: SearchUsersFilters): QueryBuilder<User, UserData[]> {
    let query = User.query()
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

    // Handle deleted users
    if (!filters.include_deleted) {
      query = query.whereNull('users.deleted_at');
    }

    // Refactored filter application
    query = this.applyTextSearch(query, filters);
    query = this.applyRoleStatusDomainFilters(query, filters);
    query = this.applyDateAndLoginFilters(query, filters);
    // Sorting
    const sortBy = filters.sort_by ?? 'created_at';
    const sortOrder = filters.sort_order ?? 'desc';
    query = query.orderBy(`users.${sortBy}`, sortOrder);
    return query;
  }

  /**
   * Paginate search query results
   */
  private static async paginateQuery(
    query: QueryBuilder<User, UserData[]>,
    filters: SearchUsersFilters,
  ): Promise<PaginatedResult<any>> {
    const { paginate } = await import('@/utilities/pagination');
    return paginate(query, {
      page: filters.page,
      pageSize: filters.limit,
    });
  }

  /**
   * Get search suggestions for autocomplete
   */
  static async getSearchSuggestions(
    query: string,
    limit: number = 10,
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const searchTerm = query.toLowerCase();

    // Name suggestions
    const nameSuggestions = await User.query()
      .select('name')
      .whereRaw('LOWER(name) LIKE ?', [`%${searchTerm}%`])
      .whereNull('deleted_at')
      .groupBy('name')
      .limit(limit)
      .count('* as count');

    nameSuggestions.forEach((suggestion: any) => {
      suggestions.push({
        value: suggestion.name,
        type: 'name',
        count: parseInt(suggestion.count),
      });
    });

    // Email suggestions
    const emailSuggestions = await User.query()
      .select('email')
      .whereRaw('LOWER(email) LIKE ?', [`%${searchTerm}%`])
      .whereNull('deleted_at')
      .groupBy('email')
      .limit(limit)
      .count('* as count');

    emailSuggestions.forEach((suggestion: any) => {
      suggestions.push({
        value: suggestion.email,
        type: 'email',
        count: parseInt(suggestion.count),
      });
    });

    // Domain suggestions
    const domainSuggestions = await User.query()
      .select(User.raw("SUBSTRING(email FROM POSITION('@' IN email) + 1) as domain"))
      .whereRaw('LOWER(email) LIKE ?', [`%@${searchTerm}%`])
      .whereNull('deleted_at')
      .groupBy('domain')
      .limit(limit)
      .count('* as count');

    domainSuggestions.forEach((suggestion: any) => {
      suggestions.push({
        value: suggestion.domain,
        type: 'domain',
        count: parseInt(suggestion.count),
      });
    });

    // Move sort to a separate statement for SonarLint
    suggestions.sort((a, b) => b.count - a.count);
    return suggestions.slice(0, limit);
  }

  /**
   * Get comprehensive user statistics for admin dashboard
   */
  static async getUserStatistics(): Promise<UserStatistics> {
    const [totalUsers, activeUsers, inactiveUsers, suspendedUsers, verifiedUsers] =
      await Promise.all([
        User.query().whereNull('deleted_at').count('* as count').first(),
        User.query().whereNull('deleted_at').where('status', 'active').count('* as count').first(),
        User.query()
          .whereNull('deleted_at')
          .where('status', 'inactive')
          .count('* as count')
          .first(),
        User.query()
          .whereNull('deleted_at')
          .where('status', 'suspended')
          .count('* as count')
          .first(),
        User.query()
          .whereNull('deleted_at')
          .whereNotNull('email_verified_at')
          .count('* as count')
          .first(),
      ]);

    // Users by role
    const usersByRole = await User.query()
      .select('roles.name as role_name')
      .count('users.id as count')
      .leftJoin('roles', 'roles.id', 'users.role_id')
      .whereNull('users.deleted_at')
      .groupBy('roles.name')
      .orderBy('count', 'desc');

    // Recent signups (last 30 days)
    const thirtyDaysAgo = dayjs().subtract(30, 'days').toISOString();
    const recentSignups = await User.query()
      .whereNull('deleted_at')
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count')
      .first();

    // Average login frequency (users with login activity in last 90 days)
    const ninetyDaysAgo = dayjs().subtract(90, 'days').toISOString();
    const activeLoginUsers = await User.query()
      .whereNull('deleted_at')
      .whereNotNull('last_login_at')
      .where('last_login_at', '>=', ninetyDaysAgo)
      .count('* as count')
      .first();

    return {
      total_users: parseInt(totalUsers?.count || '0'),
      active_users: parseInt(activeUsers?.count || '0'),
      inactive_users: parseInt(inactiveUsers?.count || '0'),
      suspended_users: parseInt(suspendedUsers?.count || '0'),
      verified_users: parseInt(verifiedUsers?.count || '0'),
      users_by_role: usersByRole.map((item: any) => ({
        role_name: item.role_name || 'No Role',
        count: parseInt(item.count),
      })),
      recent_signups: parseInt(recentSignups?.count || '0'),
      avg_login_frequency: parseInt(activeLoginUsers?.count || '0'),
    };
  }

  /**
   * Get users by email domain
   */
  static async getUsersByDomain(
    domain: string,
    filters: Partial<SearchUsersFilters> = {},
  ): Promise<PaginatedResult<any>> {
    const domainFilters: SearchUsersFilters = {
      ...filters,
      email_domain: domain,
    };
    return this.searchUsers(domainFilters);
  }

  /**
   * Get users created in date range
   */
  static async getUsersByDateRange(
    startDate: string,
    endDate: string,
    filters: Partial<SearchUsersFilters> = {},
  ): Promise<PaginatedResult<any>> {
    const dateFilters: SearchUsersFilters = {
      ...filters,
      created_after: startDate,
      created_before: endDate,
    };
    return this.searchUsers(dateFilters);
  }
}
