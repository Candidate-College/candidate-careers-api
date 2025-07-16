import knex from 'knex';
import mockDb from 'mock-knex';
import { UserRepository } from '@/repositories/user-repository';

// Mock DB setup
const db = knex({ client: 'pg' });
mockDb.mock(db);
const tracker = mockDb.getTracker();

// Bind ORM model to mock knex once
beforeAll(async () => {
  const Model = require('@/config/database/orm');
  Model.knex(db);
});

beforeEach(() => tracker.install());
afterEach(() => tracker.uninstall());
afterAll(() => mockDb.unmock(db));

describe('UserRepository.findByUuid', () => {
  it('returns user with role join', async () => {
    const fakeUser = { id: 1, uuid: 'abc', name: 'Test' };

    tracker.on('query', (query: any) => {
      query.response([fakeUser]);
    });

    const result = await UserRepository.findByUuid('abc');
    expect(result).toEqual(fakeUser);
  });
});
