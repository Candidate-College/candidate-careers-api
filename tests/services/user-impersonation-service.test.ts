/**
 * UserImpersonationService Tests
 *
 * Unit tests for super admin impersonation capabilities, including edge cases and error handling.
 */

// @ts-nocheck

// Move jest.mock calls to the very top to avoid ReferenceError
jest.mock('@/repositories/user-repository', () => ({
  UserRepository: {
    findDetailedByUuid: jest.fn(),
  },
}));
jest.mock('@/services/audit/activity-log-service', () => ({
  ActivityLogService: {
    logUserAction: jest.fn(),
  },
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  JsonWebTokenError: class extends Error {},
}));

import { UserImpersonationService } from '@/services/user/user-impersonation-service';
import { UserRepository } from '@/repositories/user-repository';
import { ActivityLogService } from '@/services/audit/activity-log-service';
import jwt from 'jsonwebtoken';

const mockUserRepository = UserRepository;
const mockActivityLogService = ActivityLogService as jest.Mocked<typeof ActivityLogService>;
const mockJwt = jwt;

const superAdmin = {
  id: 1,
  name: 'Super Admin',
  email: 'admin@example.com',
  role: { name: 'super_admin' },
  created_at: new Date(),
  updated_at: new Date(),
};
const normalUser = {
  id: 2,
  name: 'Normal User',
  email: 'user@example.com',
  role: { name: 'user' },
  created_at: new Date(),
  updated_at: new Date(),
};
const anotherSuperAdmin = {
  id: 3,
  name: 'Another Super Admin',
  email: 'admin2@example.com',
  role: { name: 'super_admin' },
  created_at: new Date(),
  updated_at: new Date(),
};

describe('User Impersonation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create impersonation token for valid user', async () => {
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin) // admin
      .mockResolvedValueOnce(normalUser); // target
    mockJwt.sign.mockReturnValue('impersonation.jwt.token');
    mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

    const result = await UserImpersonationService.createImpersonationToken(1, 'uuid-2', {
      duration_minutes: 30,
      reason: 'Support',
    });
    expect(result.token).toBe('impersonation.jwt.token');
    expect(result.adminId).toBe(1);
    expect(result.targetUserId).toBe(2);
    expect(mockActivityLogService.logUserAction).toHaveBeenCalled();
  });

  test('should validate impersonation token correctly', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockJwt.verify.mockReturnValue({
      exp: now + 3600,
      iat: now,
      adminId: 1,
      targetUserId: 2,
      targetUserUuid: 'uuid-2',
      sessionId: 'session-123',
      reason: 'Support',
    });
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin) // admin
      .mockResolvedValueOnce(normalUser); // target

    const session = await UserImpersonationService.validateImpersonationToken(
      'impersonation.jwt.token',
    );
    expect(session.isActive).toBe(true);
    expect(session.adminId).toBe(1);
    expect(session.targetUserId).toBe(2);
  });

  test('should log all impersonation activities', async () => {
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin)
      .mockResolvedValueOnce(normalUser);
    mockJwt.sign.mockReturnValue('impersonation.jwt.token');
    mockActivityLogService.logUserAction.mockResolvedValue({ success: true });

    await UserImpersonationService.createImpersonationToken(1, 'uuid-2', { reason: 'Audit' });
    expect(mockActivityLogService.logUserAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      'user_impersonation_started',
      'user',
      expect.stringContaining('Started impersonating user'),
      expect.any(Object),
    );
  });

  test('should maintain original admin context', async () => {
    // Validate that adminId is preserved in token/session
    const now = Math.floor(Date.now() / 1000);
    mockJwt.verify.mockReturnValue({
      exp: now + 3600,
      iat: now,
      adminId: 1,
      targetUserId: 2,
      targetUserUuid: 'uuid-2',
      sessionId: 'session-123',
      reason: 'Support',
    });
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin)
      .mockResolvedValueOnce(normalUser);

    const session = await UserImpersonationService.validateImpersonationToken(
      'impersonation.jwt.token',
    );
    expect(session.adminId).toBe(1);
    expect(session.targetUserId).toBe(2);
  });

  // Failing test cases
  test('should fail impersonating non-existent user', async () => {
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin)
      .mockResolvedValueOnce(null); // target not found
    await expect(
      UserImpersonationService.createImpersonationToken(1, 'uuid-404', {}),
    ).rejects.toThrow('Target user not found');
  });

  test('should fail impersonating another super admin', async () => {
    mockUserRepository.findDetailedByUuid
      .mockResolvedValueOnce(superAdmin)
      .mockResolvedValueOnce(anotherSuperAdmin);
    await expect(
      UserImpersonationService.createImpersonationToken(1, 'uuid-3', {}),
    ).rejects.toThrow('Cannot impersonate other super administrators');
  });

  test('should fail with expired impersonation token', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockJwt.verify.mockReturnValue({
      exp: now - 10, // expired
      iat: now - 3600,
      adminId: 1,
      targetUserId: 2,
      targetUserUuid: 'uuid-2',
      sessionId: 'session-123',
      reason: 'Support',
    });
    await expect(
      UserImpersonationService.validateImpersonationToken('impersonation.jwt.token'),
    ).rejects.toThrow('Impersonation token has expired');
  });

  test('should prevent non-super-admin impersonation', async () => {
    mockUserRepository.findDetailedByUuid.mockResolvedValueOnce(normalUser); // not super admin
    await expect(
      UserImpersonationService.createImpersonationToken(2, 'uuid-1', {}),
    ).rejects.toThrow('Only super administrators can impersonate users');
  });
});
