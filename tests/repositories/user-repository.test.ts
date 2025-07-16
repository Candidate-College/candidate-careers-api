import knex from 'knex';
import mockDb from 'mock-knex';
import { UserRepository } from '@/repositories/user-repository';

// Initialize in-memory Knex instance for mocking
const db = knex({ client: 'pg' });
mockDb.mock(db);
const tracker = mockDb.getTracker();

afterAll(() => {
  mockDb.unmock(db);
});

describe('UserRepository.list', () => {
  beforeAll(() => {
    // Bind objection Model to mock knex
    const Model = require('@/config/database/orm');
    Model.knex(db);
  });

  beforeEach(() => tracker.install());
  afterEach(() => tracker.uninstall());

  test('should apply pagination defaults', async () => {
    tracker.on('query', (query: any) => {
      const sql = query.sql.toLowerCase();
      if (sql.includes('count')) {
        query.response([{ total: 1 }]);
        return;
      }
      query.response([
        {
          id: 1,
          uuid: 'uuid-1',
          email: 'admin@example.com',
          name: 'Admin',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    });

    const result = await UserRepository.list({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(1);
    expect(result.data.length).toBe(1);
  });

  test('should apply search filter and role filter', async () => {
    tracker.on('query', (query: any) => {
      const sql = query.sql.toLowerCase();
      if (sql.includes('count')) {
        query.response([{ total: 0 }]);
        return;
      }
      expect(sql).toContain('lower(users.name)');
      expect(sql).toContain('role_id');
      query.response([]);
    });

    const filters = { search: 'john', role_id: 2 };
    const result = await UserRepository.list(filters as any);
    expect(result.total).toBe(0);
  });
});
