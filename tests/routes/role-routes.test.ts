import request from 'supertest';
import app from '@/app';

// Mock authorization middleware to bypass permission checks
jest.mock('@/middlewares/authorization/authorize', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock RoleRepository
jest.mock('@/repositories/role-repository', () => {
  return {
    RoleRepository: {
      create: jest.fn(async (data) => ({ id: 1, ...data })),
      list: jest.fn(async () => ({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 1 })),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
      delete: jest.fn(async () => 1),
    },
  };
});

describe('Role routes', () => {
  it('POST /api/v1/roles returns 201', async () => {
    const res = await request(app)
      .post('/api/v1/roles')
      .send({ name: 'editor', display_name: 'Editor' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBeTruthy();
  });

  it('GET /api/v1/roles returns paginated list', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
  });

  it('PATCH /api/v1/roles/1 updates role', async () => {
    const res = await request(app).patch('/api/v1/roles/1').send({ display_name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
  });

  it('DELETE /api/v1/roles/1 deletes role', async () => {
    const res = await request(app).delete('/api/v1/roles/1');
    expect(res.status).toBe(204);
  });
});
