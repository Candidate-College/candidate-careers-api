import { authorize } from '@/middlewares/authorization/authorize';
import { RolePermissionService } from '@/services/rbac/role-permission-service';
import { NextFunction, Request, Response } from 'express';

jest.mock('@/services/rbac/role-permission-service');

const mockHasPermission = jest.fn();
(RolePermissionService as jest.Mocked<typeof RolePermissionService>).hasPermission = mockHasPermission;

afterEach(() => {
  jest.clearAllMocks();
});

const getMockRes = () => {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return { status, json } as unknown as Response;
};

const next: NextFunction = jest.fn();

describe('authorize middleware', () => {
  it('returns 401 when req.user is missing', async () => {
    const mw = authorize('posts.read');
    const req = {} as Request;
    const res = getMockRes();
    // @ts-ignore
    await mw(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when user lacks permission', async () => {
    mockHasPermission.mockResolvedValue(false);
    // @ts-ignore
    const req = { user: { id: 1 } } as Request;
    const res = getMockRes();
    const mw = authorize('posts.update');
    await mw(req, res, next);
    expect(mockHasPermission).toHaveBeenCalledWith(1, 'posts.update');
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next when permission granted', async () => {
    mockHasPermission.mockResolvedValue(true);
    const req = { user: { id: 2 } } as unknown as Request;
    const res = getMockRes();
    const mw = authorize('admin');
    await mw(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
