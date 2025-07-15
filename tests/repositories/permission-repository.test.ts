/**
 * PermissionRepository unit tests (mocked Objection query builder)
 */

import { PermissionRepository } from '@/repositories/permission-repository';
import { paginate } from '@/utilities/pagination';

jest.mock('@/utilities/pagination');

// @ts-nocheck
var fakeQb: any;

jest.mock('@/models/permission-model', () => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    orWhereILike: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  };
  fakeQb = qb;
  return {
    Permission: {
      query: jest.fn().mockReturnValue(qb),
    },
  };
});

const paginateMock = paginate as jest.MockedFunction<typeof paginate>;

beforeEach(() => {
  jest.clearAllMocks();
  paginateMock.mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
});

describe('PermissionRepository.list', () => {
  it('calls paginate with correct query builder', async () => {
    await PermissionRepository.list({ page: 1 });
    expect(paginateMock).toHaveBeenCalledWith(fakeQb, { page: 1 });
  });

  it('adds search filter when search term provided', async () => {
    await PermissionRepository.list({}, 'write');
    expect(fakeQb.where).toHaveBeenCalled();
    expect(paginateMock).toHaveBeenCalled();
  });
});
