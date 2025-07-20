import request from 'supertest';
process.env.NODE_ENV = 'test';
// Import app after setting env
import app from '@/app';

// Mock auth middleware
jest.mock('@/middlewares/authorization/authorize', () => ({
  authorize: () => (_req: any, _res: any, next: any) => next(),
}));

// Mock repository
jest.mock('@/repositories/role-permission-repository', () => {
  return {
    RolePermissionRepository: {
      bulkAssign: jest.fn(async () => 2),
      revoke: jest.fn(async () => 1),
    },
  };
});

describe('Role-Permission routes', () => {
  it('POST /api/v1/roles/1/permissions bulk assigns', async () => {
    const res = await request(app)
      .post('/api/v1/roles/1/permissions')
      .send({ permissionIds: [1, 2] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBeTruthy();
    expect(res.body.inserted).toBe(2);
  });

  it('DELETE /api/v1/roles/1/permissions/2 revokes', async () => {
    const res = await request(app).delete('/api/v1/roles/1/permissions/2');
    expect(res.status).toBe(204);
  });
});
