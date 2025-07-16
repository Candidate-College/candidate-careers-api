/**
 * UserManagementService Tests
 *
 * Comprehensive unit tests for user management operations including
 * CRUD operations, bulk operations, password reset, and validation.
 *
 * @module tests/services/user-management-service
 */

import { UserManagementService } from '@/services/user/user-management-service';
import { UserRepository } from '@/repositories/user-repository';
import { ActivityLogService } from '@/services/audit/activity-log-service';
import { emailService } from '@/services/email/email-service';

// Mock dependencies
jest.mock('@/repositories/user-repository');
jest.mock('@/services/audit/activity-log-service');
jest.mock('@/services/email/email-service');
jest.mock('@/config/database/orm', () => ({
  Model: {
    query: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      whereIn: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      raw: jest.fn().mockReturnThis(),
    })),
  },
}));
jest.mock('objection', () => ({
  transaction: jest.fn((model, callback) => callback({})),
}));

const mockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const mockActivityLogService = ActivityLogService as jest.Mocked<typeof ActivityLogService>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe('UserManagementService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUser', () => {
    const mockUser = {
      id: 1,
      uuid: 'test-uuid',
      name: 'Test User',
      email: 'test@example.com',
      role_id: 2,
      status: 'active',
      role: { name: 'user', display_name: 'User' },
    };

    it('should update user successfully', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.updateByUuid.mockResolvedValue({
        ...mockUser,
        name: 'Updated User',
      } as any);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.updateUser(
        'test-uuid',
        { name: 'Updated User' },
        1,
      );

      expect(mockUserRepository.findDetailedByUuid).toHaveBeenCalledWith('test-uuid');
      expect(mockUserRepository.updateByUuid).toHaveBeenCalledWith(
        'test-uuid',
        { name: 'Updated User', updated_at: expect.any(Date) },
        expect.any(Object),
      );
      expect(mockActivityLogService.logUserAction).toHaveBeenCalled();
      expect((result as any)?.name).toBe('Updated User');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(undefined);

      await expect(
        UserManagementService.updateUser('invalid-uuid', { name: 'Updated User' }, 1),
      ).rejects.toThrow('User not found');
    });

    it('should send notification when role changes', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.updateByUuid.mockResolvedValue({ ...mockUser, role_id: 3 } as any);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      await UserManagementService.updateUser(
        'test-uuid',
        { role_id: 3, send_notification: true },
        1,
      );

      expect(mockEmailService.sendRoleChangeNotification).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    const mockUser = {
      id: 1,
      uuid: 'test-uuid',
      name: 'Test User',
      email: 'test@example.com',
      role_id: 2,
      status: 'active',
    };

    it('should soft delete user successfully', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.deleteByUuid.mockResolvedValue(1);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.deleteUser(
        'test-uuid',
        { confirmation: 'DELETE' },
        2,
      );

      expect(mockUserRepository.deleteByUuid).toHaveBeenCalledWith('test-uuid', expect.any(Object));
      expect(mockActivityLogService.logUserAction).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(1);
    });

    it('should hard delete user when permanent is true', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.hardDeleteByUuid.mockResolvedValue(1);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.deleteUser(
        'test-uuid',
        { confirmation: 'DELETE', permanent: true },
        2,
      );

      expect(mockUserRepository.hardDeleteByUuid).toHaveBeenCalledWith(
        'test-uuid',
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should throw error if confirmation is not DELETE', async () => {
      await expect(
        UserManagementService.deleteUser('test-uuid', { confirmation: 'CANCEL' }, 2),
      ).rejects.toThrow('Confirmation must be "DELETE" to proceed');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(undefined);

      await expect(
        UserManagementService.deleteUser('invalid-uuid', { confirmation: 'DELETE' }, 2),
      ).rejects.toThrow('User not found');
    });

    it('should prevent self-deletion', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);

      await expect(
        UserManagementService.deleteUser('test-uuid', { confirmation: 'DELETE' }, 1),
      ).rejects.toThrow('Cannot delete your own account');
    });
  });

  describe('bulkUserOperations', () => {
    const mockUsers = [
      { id: 1, uuid: 'uuid-1', role: { name: 'user' } },
      { id: 2, uuid: 'uuid-2', role: { name: 'user' } },
    ];

    it('should activate multiple users successfully', async () => {
      mockUserRepository.findByUuids.mockResolvedValue(mockUsers as any);
      mockUserRepository.bulkUpdateByUuids.mockResolvedValue(2);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.bulkUserOperations(
        'activate',
        ['uuid-1', 'uuid-2'],
        {},
        1,
      );

      expect(mockUserRepository.bulkUpdateByUuids).toHaveBeenCalledWith(
        ['uuid-1', 'uuid-2'],
        { status: 'active' },
        expect.any(Object),
      );
      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
    });

    it('should change role for multiple users', async () => {
      mockUserRepository.findByUuids.mockResolvedValue(mockUsers as any);
      mockUserRepository.bulkUpdateByUuids.mockResolvedValue(2);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.bulkUserOperations(
        'change_role',
        ['uuid-1', 'uuid-2'],
        { role_id: 3 },
        1,
      );

      expect(mockUserRepository.bulkUpdateByUuids).toHaveBeenCalledWith(
        ['uuid-1', 'uuid-2'],
        { role_id: 3 },
        expect.any(Object),
      );
      expect(result.success).toBe(true);
    });

    it('should throw error if too many users in bulk operation', async () => {
      const manyUuids = Array.from({ length: 1001 }, (_, i) => `uuid-${i}`);

      await expect(
        UserManagementService.bulkUserOperations('activate', manyUuids, {}, 1),
      ).rejects.toThrow('Bulk operations limited to 1000 users at a time');
    });

    it('should throw error if role_id is missing for change_role action', async () => {
      await expect(
        UserManagementService.bulkUserOperations('change_role', ['uuid-1'], {}, 1),
      ).rejects.toThrow('role_id is required for change_role action');
    });

    it('should throw error if some users not found', async () => {
      mockUserRepository.findByUuids.mockResolvedValue([mockUsers[0]] as any);

      await expect(
        UserManagementService.bulkUserOperations('activate', ['uuid-1', 'uuid-2'], {}, 1),
      ).rejects.toThrow('Some users not found');
    });
  });

  describe('resetUserPassword', () => {
    const mockUser = {
      id: 1,
      uuid: 'test-uuid',
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should reset password with generated temporary password', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.updateByUuid.mockResolvedValue(mockUser as any);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await UserManagementService.resetUserPassword('test-uuid', {
        generate_temporary: true,
        send_email: true,
      });

      expect(mockUserRepository.updateByUuid).toHaveBeenCalledWith(
        'test-uuid',
        {
          password_hash: expect.any(String),
          updated_at: expect.any(Date),
        },
        expect.any(Object),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBeDefined();
    });

    it('should reset password with provided password', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(mockUser as any);
      mockUserRepository.updateByUuid.mockResolvedValue(mockUser as any);
      mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

      const result = await UserManagementService.resetUserPassword('test-uuid', {
        generate_temporary: false,
        new_password: 'NewPassword123!',
      });

      expect(result.success).toBe(true);
      expect(result.temporaryPassword).toBeUndefined();
    });

    it('should throw error if neither generate_temporary nor new_password provided', async () => {
      await expect(UserManagementService.resetUserPassword('test-uuid', {})).rejects.toThrow(
        'Either generate_temporary must be true or new_password must be provided',
      );
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findDetailedByUuid.mockResolvedValue(undefined);

      await expect(
        UserManagementService.resetUserPassword('invalid-uuid', { generate_temporary: true }),
      ).rejects.toThrow('User not found');
    });
  });

  describe('listUsers', () => {
    it('should list users with filters', async () => {
      const mockResult = {
        data: [{ id: 1, name: 'Test User' }],
        pagination: { total: 1, page: 1, limit: 20 },
      };
      mockUserRepository.list.mockResolvedValue(mockResult as any);

      const result = await UserManagementService.listUsers({
        page: 1,
        limit: 20,
        search: 'test',
      });

      expect(mockUserRepository.list).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: 'test',
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserByUuid', () => {
    it('should get user by UUID', async () => {
      const mockUser = { id: 1, uuid: 'test-uuid', name: 'Test User' };
      mockUserRepository.findByUuid.mockResolvedValue(mockUser as any);

      const result = await UserManagementService.getUserByUuid('test-uuid');

      expect(mockUserRepository.findByUuid).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
      mockUserRepository.create.mockResolvedValue(mockUser as any);
      mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await UserManagementService.createUser({
        email: 'test@example.com',
        name: 'Test User',
        role_id: 2,
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          role_id: 2,
          status: 'active',
          password_hash: expect.any(String),
        }),
        expect.any(Object),
      );
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });
});
