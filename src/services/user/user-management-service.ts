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
import { generateSecurePassword } from '@/utilities/password-generator';
import bcrypt from 'bcrypt';
import { emailService } from '@/services/email/email-service';

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

  static async getUserByUuid(uuid: string) {
    return UserRepository.findByUuid(uuid);
  }

  static async createUser(payload: { email: string; name: string; role_id: number; status?: 'active'|'inactive'|'suspended'; }) {
    const { transaction } = await import('objection');
    const tempPassword = generateSecurePassword();
    const hashed = bcrypt.hashSync(tempPassword, 10);

    let user;
    await transaction(UserRepository as any, async (trx: any) => {
      user = await UserRepository.create({
      email: payload.email,
      name: payload.name,
      role_id: payload.role_id,
      status: payload.status ?? 'active',
      password_hash: hashed,
      created_at: new Date(),
      updated_at: new Date(),
    });

          await emailService.sendWelcomeEmail(user.email, user.name, tempPassword);
    });
    return user;
  }
}
