/**
 * Audit Controller Integration Tests (Express)
 *
 * Uses supertest to exercise the admin audit routes. The database is NOT
 * touched – underlying services are mocked to isolate controller + routing
 * behaviour, including validation and authorization middleware chains.
 */

import request from 'supertest';
import express, { NextFunction, Request, Response } from 'express';

// We will mock the heavy services
jest.mock('@/services/audit/activity-retrieval-service', () => ({
  ActivityRetrievalService: {
    getActivityLogs: jest.fn().mockResolvedValue({ success: true, data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasNext: false, hasPrevious: false } }),
    getActivityById: jest.fn().mockResolvedValue({ id: 1 }),
    getUserActivityHistory: jest.fn().mockResolvedValue({ items: [], meta: { total: 0 } }),
  },
}));

jest.mock('@/services/audit/activity-analytics-service', () => ({
  ActivityAnalyticsService: {
    getActivityStatistics: jest.fn().mockResolvedValue({ success: true, data: 'stats' }),
    getDashboardData: jest.fn().mockResolvedValue({ success: true, data: 'dashboard' }),
  },
}));

// Mock auth and role middlewares to bypass checks in a controlled way
jest.mock('@/middlewares/auth-middleware', () => ({
  accessToken: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('@/middlewares/role-middleware', () => ({
  requireRole: (_role: string) => (_req: Request, _res: Response, next: NextFunction) => next(),
}));

// Validation middleware – skip behaviour for simplicity in positive tests; to test validation we allow it to fail
jest.mock('@/middlewares/request-validation-middleware', () => {
  const actual = jest.requireActual('@/middlewares/request-validation-middleware');
  return (schema: any, _opts: any) => (req: Request, _res: Response, next: NextFunction) => {
    // trivial validation: if query contains invalid param marker, throw error
    if (req.query.invalid === 'true') {
      return next(new Error('Validation error'));
    }
    return next();
  };
});

// Bring in the route after mocks so they pick up the mocked deps
const auditRouter = require('@/routes/v1/admin/audit-routes');

const app = express();
app.use(express.json());

// Inject JsonResponse helpers used by controllers
app.use((req: Request, res: Response, next: NextFunction) => {
  (res as any).success = (message: string, data?: unknown) =>
    res.status(200).json({ success: true, message, data });
  (res as any).error = (code: number = 500, message: string = 'Error') =>
    res.status(code).json({ success: false, message });
  next();
});

app.use('/api/v1/admin/audit', auditRouter);
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  return res.status(422).json({ success: false, message: err.message });
});

describe('AuditController Endpoints', () => {
  it('GET /logs returns 200 with payload', async () => {
    const res = await request(app).get('/api/v1/admin/audit/logs');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /logs/:id returns 404 when not found', async () => {
    const { ActivityRetrievalService } = require('@/services/audit/activity-retrieval-service');
    ActivityRetrievalService.getActivityById.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/v1/admin/audit/logs/99');
    expect(res.statusCode).toBe(404);
  });

  it('GET /users/:uuid/activity respects uuid param', async () => {
    const res = await request(app).get('/api/v1/admin/audit/users/abc-123/activity');
    expect(res.statusCode).toBe(200);
  });

  it('GET /statistics returns stats', async () => {
    const res = await request(app).get('/api/v1/admin/audit/statistics');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBe('stats');
  });

  it('GET /dashboard returns dashboard data', async () => {
    const res = await request(app).get('/api/v1/admin/audit/dashboard');
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBe('dashboard');
  });

  it('Validation failure returns 422', async () => {
    const res = await request(app).get('/api/v1/admin/audit/logs?invalid=true');
    expect(res.statusCode).toBe(422);
  });
});
