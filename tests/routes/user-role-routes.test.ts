import request from 'supertest';
process.env.NODE_ENV = 'test';
import app from '@/app';

// Mock auth middleware so it always passes
jest.mock('@/middlewares/authorization/authorize', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock repository functions
jest.mock('@/repositories/user-role-repository', () => {
  return {
    UserRoleRepository: {
      bulkAssign: jest.fn(async () => 3),
      revoke: jest.fn(async () => 1),
    },
  };
});

describe('User-Role routes', () => {
  it('POST /api/v1/users/5/roles assigns roles', async () => {
    const res = await request(app)
      .post('/api/v1/users/5/roles')
      .send({ roleIds: [1, 2, 3] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.inserted).toBe(3);
  });

  it('DELETE /api/v1/users/5/roles/2 revokes role', async () => {
    const res = await request(app).delete('/api/v1/users/5/roles/2');
    expect(res.status).toBe(204);
  });
});
