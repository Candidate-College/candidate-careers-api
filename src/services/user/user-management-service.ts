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

  static async createUser(payload: {
    email: string;
    name: string;
    role_id: number;
    status?: 'active' | 'inactive' | 'suspended';
  }) {
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

  /**
   * Update user by UUID with validation and audit logging
   */
  static async updateUser(
    uuid: string,
    updateData: {
      name?: string;
      role_id?: number;
      status?: 'active' | 'inactive' | 'suspended';
      send_notification?: boolean;
    },
    updatedBy: number,
  ) {
    const { transaction } = await import('objection');
    const { ActivityLogService } = await import('@/services/audit/activity-log-service');

    // Get current user data for audit logging
    const currentUser = await UserRepository.findDetailedByUuid(uuid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    let updatedUser;
    await transaction(UserRepository as any, async (trx: any) => {
      // Update user
      updatedUser = await UserRepository.updateByUuid(
        uuid,
        {
          ...updateData,
          updated_at: new Date(),
        },
        trx,
      );

      if (!updatedUser) {
        throw new Error('Failed to update user');
      }

      // Log activity
      await ActivityLogService.logUserAction(
        { id: updatedBy } as any,
        'user_updated',
        'user',
        `Updated user ${currentUser.name} (${currentUser.email})`,
        {
          resourceId: currentUser.id,
          resourceUuid: uuid,
          oldValues: {
            name: currentUser.name,
            role_id: currentUser.role_id,
            status: currentUser.status,
          } as Record<string, unknown>,
          newValues: updateData,
        },
      );

      // Send notification if requested
      if (updateData.send_notification !== false) {
        await this.sendUserUpdateNotification(updatedUser, updateData, currentUser);
      }
    });

    return updatedUser;
  }

  /**
   * Delete user by UUID (soft delete by default)
   */
  static async deleteUser(
    uuid: string,
    options: {
      permanent?: boolean;
      reason?: string;
      confirmation: string;
    },
    deletedBy: number,
  ) {
    const { transaction } = await import('objection');
    const { ActivityLogService } = await import('@/services/audit/activity-log-service');

    // Validate confirmation
    if (options.confirmation !== 'DELETE') {
      throw new Error('Confirmation must be "DELETE" to proceed');
    }

    // Get current user data for audit logging
    const currentUser = await UserRepository.findDetailedByUuid(uuid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Prevent self-deletion
    if (currentUser.id === deletedBy) {
      throw new Error('Cannot delete your own account');
    }

    let result;
    await transaction(UserRepository as any, async (trx: any) => {
      if (options.permanent) {
        result = await UserRepository.hardDeleteByUuid(uuid, trx);
      } else {
        result = await UserRepository.deleteByUuid(uuid, trx);
      }

      if (result === 0) {
        throw new Error('Failed to delete user');
      }

      // Log activity
      await ActivityLogService.logUserAction(
        { id: deletedBy } as any,
        options.permanent ? 'user_permanently_deleted' : 'user_deleted',
        'user',
        `${options.permanent ? 'Permanently deleted' : 'Deleted'} user ${currentUser.name} (${
          currentUser.email
        })`,
        {
          resourceId: currentUser.id,
          resourceUuid: uuid,
          oldValues: currentUser as unknown as Record<string, unknown>,
          metadata: {
            reason: options.reason,
            permanent: options.permanent,
          },
        },
      );
    });

    return { success: true, deletedCount: result };
  }

  /**
   * Perform bulk operations on multiple users
   */
  static async bulkUserOperations(
    action: 'activate' | 'deactivate' | 'delete' | 'change_role' | 'suspend',
    userUuids: string[],
    params: {
      role_id?: number;
      send_notification?: boolean;
      reason?: string;
    },
    performedBy: number,
  ) {
    const { transaction } = await import('objection');
    const { ActivityLogService } = await import('@/services/audit/activity-log-service');

    // Validate bulk operation limits
    if (userUuids.length > 1000) {
      throw new Error('Bulk operations limited to 1000 users at a time');
    }

    // Validate action-specific requirements
    if (action === 'change_role' && !params.role_id) {
      throw new Error('role_id is required for change_role action');
    }

    let result;
    await transaction(UserRepository as any, async (trx: any) => {
      // Get users for validation and audit logging
      const users = await UserRepository.findByUuids(userUuids, trx);
      if (users.length !== userUuids.length) {
        throw new Error('Some users not found');
      }

      // Prevent bulk deletion of all super admins
      if (action === 'delete') {
        const superAdminCount = users.filter(u => (u.role as any)?.name === 'super_admin').length;
        const { User } = await import('@/models/user-model');
        const totalSuperAdmins = await User.query()
          .select('roles.name')
          .leftJoin('roles', 'roles.id', 'users.role_id')
          .where('roles.name', 'super_admin')
          .whereNull('users.deleted_at')
          .count('* as count')
          .first();

        if (superAdminCount >= parseInt(totalSuperAdmins?.count || '0')) {
          throw new Error('Cannot delete all super administrators');
        }
      }

      // Perform bulk operation
      switch (action) {
        case 'activate':
          result = await UserRepository.bulkUpdateByUuids(userUuids, { status: 'active' }, trx);
          break;
        case 'deactivate':
          result = await UserRepository.bulkUpdateByUuids(userUuids, { status: 'inactive' }, trx);
          break;
        case 'suspend':
          result = await UserRepository.bulkUpdateByUuids(userUuids, { status: 'suspended' }, trx);
          break;
        case 'change_role':
          result = await UserRepository.bulkUpdateByUuids(
            userUuids,
            { role_id: params.role_id },
            trx,
          );
          break;
        case 'delete':
          result = await UserRepository.bulkDeleteByUuids(userUuids, trx);
          break;
        default:
          throw new Error(`Unsupported bulk action: ${action}`);
      }

      // Log bulk activity
      await ActivityLogService.logUserAction(
        { id: performedBy } as any,
        `bulk_${action}`,
        'user',
        `Bulk ${action} operation on ${result} users`,
        {
          resourceId: users[0]?.id,
          resourceUuid: userUuids[0],
          oldValues: users as unknown as Record<string, unknown>,
          newValues: { action, params },
          metadata: {
            affected_count: result,
            reason: params.reason,
            affected_user_ids: users.map(u => u.id),
            affected_user_uuids: userUuids,
          },
        },
      );

      // Send notifications if requested
      if (params.send_notification && action !== 'delete') {
        await this.sendBulkOperationNotifications(users, action, params);
      }
    });

    return { success: true, affectedCount: result };
  }

  /**
   * Reset user password with options
   */
  static async resetUserPassword(
    uuid: string,
    options: {
      generate_temporary?: boolean;
      send_email?: boolean;
      require_change?: boolean;
      new_password?: string;
    },
  ) {
    const { transaction } = await import('objection');
    const { ActivityLogService } = await import('@/services/audit/activity-log-service');

    const currentUser = await UserRepository.findDetailedByUuid(uuid);
    if (!currentUser) {
      throw new Error('User not found');
    }

    let newPassword: string;
    if (options.generate_temporary !== false) {
      newPassword = generateSecurePassword();
    } else if (options.new_password) {
      newPassword = options.new_password;
    } else {
      throw new Error('Either generate_temporary must be true or new_password must be provided');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    let result;
    await transaction(UserRepository as any, async (trx: any) => {
      result = await UserRepository.updateByUuid(
        uuid,
        {
          password_hash: hashedPassword,
          updated_at: new Date(),
        },
        trx,
      );

      if (!result) {
        throw new Error('Failed to reset password');
      }

      // Log activity
      await ActivityLogService.logUserAction(
        { id: currentUser.id } as any,
        'password_reset',
        'user',
        `Password reset for user ${currentUser.name} (${currentUser.email})`,
        {
          resourceId: currentUser.id,
          resourceUuid: uuid,
          metadata: {
            require_change: options.require_change,
            temporary_generated: options.generate_temporary !== false,
          },
        },
      );

      // Send email if requested
      if (options.send_email !== false) {
        await emailService.sendPasswordResetEmail(currentUser.email, currentUser.name, newPassword);
      }
    });

    return {
      success: true,
      temporaryPassword: options.generate_temporary !== false ? newPassword : undefined,
    };
  }

  /**
   * Send user update notification
   */
  private static async sendUserUpdateNotification(user: any, updateData: any, oldUser: any) {
    try {
      if (updateData.status && updateData.status !== oldUser.status) {
        await emailService.sendAccountStatusNotification(user.email, user.name, updateData.status);
      }

      if (updateData.role_id && updateData.role_id !== oldUser.role_id) {
        // Get role details for notification
        const { RoleRepository } = await import('@/repositories/role-repository');
        const newRole = await RoleRepository.findById(updateData.role_id);
        const oldRole = await RoleRepository.findById(oldUser.role_id);

        await emailService.sendRoleChangeNotification(
          user.email,
          user.name,
          oldRole?.name,
          newRole?.name,
        );
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send user update notification:', error);
    }
  }

  /**
   * Send bulk operation notifications
   */
  private static async sendBulkOperationNotifications(users: any[], action: string, params: any) {
    try {
      for (const user of users) {
        switch (action) {
          case 'activate':
            await emailService.sendAccountStatusNotification(user.email, user.name, 'active');
            break;
          case 'deactivate':
            await emailService.sendAccountStatusNotification(user.email, user.name, 'inactive');
            break;
          case 'suspend':
            await emailService.sendAccountStatusNotification(user.email, user.name, 'suspended');
            break;
          case 'change_role':
            if (params.role_id) {
              const { RoleRepository } = await import('@/repositories/role-repository');
              const newRole = await RoleRepository.findById(params.role_id);
              await emailService.sendRoleChangeNotification(
                user.email,
                user.name,
                undefined,
                newRole?.name,
              );
            }
            break;
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send bulk operation notifications:', error);
    }
  }
}
