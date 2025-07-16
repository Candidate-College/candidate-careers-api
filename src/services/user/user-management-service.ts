/**
 * UserManagementService
 *
 * Houses business logic for admin user management operations. Currently only
 * implements listUsers; future tasks will extend with CRUD, bulk, etc.
 *
 * @module src/services/user/user-management-service
 */

import { UserRepository, ListUsersFilters } from '@/repositories/user-repository';
import { PaginatedResult } from '@/utilities/pagination';

export class UserManagementService {
  static async listUsers(query: any): Promise<PaginatedResult<any>> {
    const filters: ListUsersFilters = {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      search: query.search,
      role_id: query.role_id ? Number(query.role_id) : undefined,
      status: query.status,
      created_from: query.created_from,
      created_to: query.created_to,
      sort_by: query.sort_by,
      sort_order: query.sort_order,
    };

    return UserRepository.list(filters);
  }
}
