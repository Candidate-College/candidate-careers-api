/**
 * UserSearchService Tests
 *
 * Comprehensive unit tests for user search operations including
 * advanced search, suggestions, and statistics.
 *
 * @module tests/services/user-search-service
 */

// @ts-nocheck

// Mock ORM to avoid initializing real knex
class MockModel {}
(MockModel as any).knex = jest.fn();
(MockModel as any).BelongsToOneRelation = 1;
(MockModel as any).HasManyRelation = 2;
(MockModel as any).query = jest.fn(() => ({ findById: jest.fn(), whereNull: jest.fn() }));

jest.mock('@/config/database/orm', () => MockModel);

// Mock Objection transaction before importing service
jest.mock('objection', () => ({
  transaction: (_: any, cb: any) => cb({}),
  raw: jest.fn(),
}));

import { UserSearchService } from '@/services/user/user-search-service';
import { User } from '@/models/user-model';

// Mock the User model
jest.mock('@/models/user-model');

const mockUser = User as jest.Mocked<typeof User>;

describe('UserSearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Advanced User Search', () => {
    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: { name: 'admin', display_name: 'Administrator' },
        status: 'active',
        created_at: new Date('2023-01-15'),
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: { name: 'user', display_name: 'User' },
        status: 'active',
        created_at: new Date('2023-02-20'),
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob.johnson@external.com',
        role: { name: 'user', display_name: 'User' },
        status: 'inactive',
        created_at: new Date('2023-03-10'),
      },
      {
        id: 4,
        name: 'Alice Brown',
        email: 'alice.brown@company.com',
        role: { name: 'manager', display_name: 'Manager' },
        status: 'active',
        created_at: new Date('2023-04-05'),
      },
    ];

    test('should search users by name partial match', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      // Mock pagination utility
      const mockPaginate = jest.fn().mockResolvedValue({
        data: mockUsers.filter(user => user.name.toLowerCase().includes('john')),
        pagination: { total: 1, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.searchUsers({
        q: 'john',
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.leftJoin).toHaveBeenCalledWith('roles', 'roles.id', 'users.role_id');
    });

    test('should search users by email domain', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: mockUsers.filter(user => user.email.includes('@company.com')),
        pagination: { total: 3, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.searchUsers({
        email_domain: 'company.com',
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
      expect(mockQuery.whereRaw).toHaveBeenCalledWith('LOWER(users.email) LIKE ?', [
        '%@company.com%',
      ]);
    });

    test('should combine multiple search criteria', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: mockUsers.filter(
          user =>
            user.email.includes('@company.com') &&
            user.status === 'active' &&
            user.role.name === 'admin',
        ),
        pagination: { total: 1, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.searchUsers({
        q: 'admin',
        email_domain: 'company.com',
        statuses: ['active'],
        role_ids: [1],
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
      expect(mockQuery.whereIn).toHaveBeenCalledWith('users.role_id', [1]);
      expect(mockQuery.whereIn).toHaveBeenCalledWith('users.status', ['active']);
    });

    test('should handle empty search results gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.searchUsers({
        q: 'nonexistent',
        limit: 10,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });

    test('should handle exact match search', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [mockUsers[0]],
        pagination: { total: 1, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      await UserSearchService.searchUsers({
        q: 'John Doe',
        exact_match: true,
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
    });
  });

  describe('Search Suggestions', () => {
    test('should provide search suggestions for names', async () => {
      const mockNameSuggestions = [
        { name: 'John Doe', count: '5' },
        { name: 'Jane Smith', count: '3' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(mockNameSuggestions),
      };

      // Mock empty results for email and domain queries
      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([]),
      };

      mockUser.query
        .mockReturnValueOnce(mockQuery) // name query
        .mockReturnValueOnce(mockEmptyQuery) // email query
        .mockReturnValueOnce(mockEmptyQuery); // domain query

      mockUser.raw = jest.fn().mockReturnValue('raw_sql');

      const result = await UserSearchService.getSearchSuggestions('jo', 5);

      expect(mockUser.query).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('name');
      expect(result[0].value).toBe('John Doe');
      expect(result[0].count).toBe(5);
    });

    test('should provide search suggestions for emails', async () => {
      const mockEmailSuggestions = [
        { email: 'john@example.com', count: '2' },
        { email: 'jane@example.com', count: '1' },
      ];

      // Mock empty results for name and domain queries
      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([]),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(mockEmailSuggestions),
      };

      mockUser.query
        .mockReturnValueOnce(mockEmptyQuery) // name query
        .mockReturnValueOnce(mockQuery) // email query
        .mockReturnValueOnce(mockEmptyQuery); // domain query

      const result = await UserSearchService.getSearchSuggestions('john@', 5);

      expect(mockUser.query).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('email');
      expect(result[0].value).toBe('john@example.com');
      expect(result[0].count).toBe(2);
    });

    test('should provide search suggestions for domains', async () => {
      const mockDomainSuggestions = [
        { domain: 'example.com', count: '10' },
        { domain: 'company.com', count: '5' },
      ];

      // Mock empty results for name and email queries
      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([]),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(mockDomainSuggestions),
      };

      mockUser.query
        .mockReturnValueOnce(mockEmptyQuery) // name query
        .mockReturnValueOnce(mockEmptyQuery) // email query
        .mockReturnValueOnce(mockQuery); // domain query

      mockUser.raw = jest.fn().mockReturnValue('raw_sql');

      const result = await UserSearchService.getSearchSuggestions('example', 5);

      expect(mockUser.query).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('domain');
      expect(result[0].value).toBe('example.com');
      expect(result[0].count).toBe(10);
    });

    test('should limit suggestions based on count', async () => {
      const mockSuggestions = [
        { name: 'John Doe', count: '10' },
        { name: 'Jane Smith', count: '5' },
        { name: 'Bob Johnson', count: '3' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue(mockSuggestions),
      };

      // Mock empty results for email and domain queries
      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([]),
      };

      mockUser.query
        .mockReturnValueOnce(mockQuery) // name query
        .mockReturnValueOnce(mockEmptyQuery) // email query
        .mockReturnValueOnce(mockEmptyQuery); // domain query

      const result = await UserSearchService.getSearchSuggestions('j', 2);

      expect(result).toHaveLength(2);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });

  describe('User Statistics', () => {
    test('should get user statistics', async () => {
      const mockCounts = [
        { count: '100' }, // total
        { count: '85' }, // active
        { count: '10' }, // inactive
        { count: '5' }, // suspended
        { count: '80' }, // verified
      ];

      const mockUsersByRole = [
        { role_name: 'admin', count: '10' },
        { role_name: 'user', count: '80' },
        { role_name: 'manager', count: '10' },
      ];

      const mockRecentSignups = { count: '15' };
      const mockActiveLoginUsers = { count: '60' };

      const mockQuery = {
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereNotNull: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest
          .fn()
          .mockResolvedValueOnce(mockCounts[0])
          .mockResolvedValueOnce(mockCounts[1])
          .mockResolvedValueOnce(mockCounts[2])
          .mockResolvedValueOnce(mockCounts[3])
          .mockResolvedValueOnce(mockCounts[4])
          .mockResolvedValueOnce(mockRecentSignups)
          .mockResolvedValueOnce(mockActiveLoginUsers),
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockUsersByRole),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const result = await UserSearchService.getUserStatistics();

      expect(result.total_users).toBe(100);
      expect(result.active_users).toBe(85);
      expect(result.inactive_users).toBe(10);
      expect(result.suspended_users).toBe(5);
      expect(result.verified_users).toBe(80);
      expect(result.users_by_role).toHaveLength(3);
      expect(result.recent_signups).toBe(15);
      expect(result.avg_login_frequency).toBe(60);
    });

    test('should handle empty statistics gracefully', async () => {
      const mockCounts = [
        { count: '0' }, // total
        { count: '0' }, // active
        { count: '0' }, // inactive
        { count: '0' }, // suspended
        { count: '0' }, // verified
      ];

      const mockQuery = {
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereNotNull: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest
          .fn()
          .mockResolvedValueOnce(mockCounts[0])
          .mockResolvedValueOnce(mockCounts[1])
          .mockResolvedValueOnce(mockCounts[2])
          .mockResolvedValueOnce(mockCounts[3])
          .mockResolvedValueOnce(mockCounts[4])
          .mockResolvedValueOnce({ count: '0' })
          .mockResolvedValueOnce({ count: '0' }),
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const result = await UserSearchService.getUserStatistics();

      expect(result.total_users).toBe(0);
      expect(result.active_users).toBe(0);
      expect(result.users_by_role).toHaveLength(0);
    });
  });

  describe('Domain and Date Range Search', () => {
    test('should get users by domain', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [{ id: 1, email: 'user@company.com' }],
        pagination: { total: 1, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.getUsersByDomain('company.com', {
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
      expect(mockQuery.whereRaw).toHaveBeenCalledWith('LOWER(users.email) LIKE ?', [
        '%@company.com%',
      ]);
    });

    test('should get users by date range', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [{ id: 1, created_at: '2023-02-15' }],
        pagination: { total: 1, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.getUsersByDateRange('2023-01-01', '2023-12-31', {
        limit: 10,
      });

      expect(mockUser.query).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith('users.created_at', '>=', expect.any(String));
      expect(mockQuery.where).toHaveBeenCalledWith('users.created_at', '<=', expect.any(String));
    });
  });

  describe('Search Performance and Edge Cases', () => {
    test('should handle large search queries efficiently', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` })),
        pagination: { total: 1000, page: 1, limit: 100 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      const result = await UserSearchService.searchUsers({
        q: 'user',
        limit: 100,
        page: 1,
      });

      expect(result.data).toHaveLength(100);
      expect(result.pagination.total).toBe(1000);
    });

    test('should handle special characters in search query', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      await UserSearchService.searchUsers({
        q: 'user@domain.com',
        exact_match: true,
      });

      expect(mockUser.query).toHaveBeenCalled();
    });

    test('should handle sorting with different fields', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
      };

      mockUser.query.mockReturnValue(mockQuery);

      const mockPaginate = jest.fn().mockResolvedValue({
        data: [],
        pagination: { total: 0, page: 1, limit: 10 },
      });

      jest.doMock('@/utilities/pagination', () => ({
        paginate: mockPaginate,
      }));

      await UserSearchService.searchUsers({
        sort_by: 'name',
        sort_order: 'asc',
      });

      expect(mockQuery.orderBy).toHaveBeenCalledWith('users.name', 'asc');
    });
  });
});
