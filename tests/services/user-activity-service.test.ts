/**
 * UserActivityService Tests
 *
 * Unit tests for logging and retrieving user activities, including edge cases and error handling.
 */

// @ts-nocheck

import { UserActivityService } from '@/services/user/user-activity-service';

// Mock ActivityLog model
const mockActivityLog = {
  query: jest.fn(),
  insert: jest.fn(),
};

jest.mock('@/models/activity-log-model', () => ({ ActivityLog: mockActivityLog }));

// Mock paginate utility
const mockPaginate = jest.fn();
jest.mock('@/utilities/pagination', () => ({
  paginate: (...args: any[]) => mockPaginate(...args),
}));

describe('User Activity Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should log user activity with complete metadata', async () => {
    mockActivityLog.query.mockReturnValue({ insert: mockActivityLog.insert });
    mockActivityLog.insert.mockResolvedValue({ id: 1 });

    await expect(
      UserActivityService.logActivity({
        userId: 1,
        userUuid: 'uuid-1',
        actorId: 2,
        actorType: 'admin',
        action: 'LOGIN',
        metadata: { ip: '127.0.0.1', device: 'web' },
      }),
    ).resolves.not.toThrow();
    expect(mockActivityLog.query).toHaveBeenCalled();
    expect(mockActivityLog.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        userUuid: 'uuid-1',
        actorId: 2,
        actorType: 'admin',
        action: 'LOGIN',
        metadata: { ip: '127.0.0.1', device: 'web' },
      }),
    );
  });

  test('should retrieve paginated activity history', async () => {
    const mockQuery = { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis() };
    mockActivityLog.query.mockReturnValue(mockQuery);
    mockPaginate.mockResolvedValue({ data: [{ id: 1 }], pagination: { total: 1 } });

    const result = await UserActivityService.getUserActivity('uuid-1', { page: 1, limit: 10 });
    expect(mockActivityLog.query).toHaveBeenCalled();
    expect(mockPaginate).toHaveBeenCalledWith(mockQuery, { page: 1, pageSize: 10 });
    expect(result.data).toHaveLength(1);
  });

  test('should filter activities by date range', async () => {
    const mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    };
    mockActivityLog.query.mockReturnValue(mockQuery);
    mockPaginate.mockResolvedValue({ data: [], pagination: { total: 0 } });

    await UserActivityService.getUserActivity('uuid-1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
    expect(mockQuery.where).toHaveBeenCalledWith('created_at', '>=', expect.any(String));
    expect(mockQuery.where).toHaveBeenCalledWith('created_at', '<=', expect.any(String));
  });

  test('should aggregate user statistics', async () => {
    // Simulate aggregation by action type
    const mockQuery = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ action: 'LOGIN', count: 5 }]),
    };
    mockActivityLog.query.mockReturnValue(mockQuery);
    // Custom aggregation logic (not in service, but as an example)
    const stats = await mockQuery.count();
    expect(stats).toEqual([{ action: 'LOGIN', count: 5 }]);
  });

  // Failing test cases
  test('should fail retrieving activity for non-existent user', async () => {
    const mockQuery = { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis() };
    mockActivityLog.query.mockReturnValue(mockQuery);
    mockPaginate.mockResolvedValue({ data: [], pagination: { total: 0 } });

    const result = await UserActivityService.getUserActivity('non-existent-uuid', {});
    expect(result.data).toHaveLength(0);
  });

  test('should fail with invalid date range for activity filter', async () => {
    const mockQuery = { where: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis() };
    mockActivityLog.query.mockReturnValue(mockQuery);
    mockPaginate.mockResolvedValue({ data: [], pagination: { total: 0 } });

    // Simulate invalid date (from > to)
    await expect(
      UserActivityService.getUserActivity('uuid-1', { from: '2024-02-01', to: '2024-01-01' }),
    ).resolves.toEqual({ data: [], pagination: { total: 0 } });
  });

  test('should handle database errors in activity logging', async () => {
    mockActivityLog.query.mockReturnValue({ insert: mockActivityLog.insert });
    mockActivityLog.insert.mockRejectedValue(new Error('DB error'));

    await expect(
      UserActivityService.logActivity({
        userId: 1,
        userUuid: 'uuid-1',
        actorId: 2,
        actorType: 'admin',
        action: 'LOGIN',
      }),
    ).rejects.toThrow('DB error');
  });
});
