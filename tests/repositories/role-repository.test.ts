/**
 * RoleRepository unit tests (mocked Objection query builder)
 */

import { RoleRepository } from '@/repositories/role-repository';
import { paginate } from '@/utilities/pagination';

jest.mock('@/utilities/pagination');

// Build a fake query builder that just returns itself for chaining
// @ts-nocheck
let fakeQb: any;

jest.mock('@/models/role-model', () => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    orWhereILike: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  };
  fakeQb = qb;
  return {
    Role: {
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

describe('RoleRepository.list', () => {
  it('calls paginate with correct query builder and options', async () => {
    const options = { page: 2, pageSize: 10 };
    await RoleRepository.list(options);

    expect(paginateMock).toHaveBeenCalledWith(fakeQb, options);
    expect(fakeQb.orderBy).toHaveBeenCalledWith('created_at', 'desc');
  });

  it('adds search filter when search provided', async () => {
    await RoleRepository.list({}, 'admin');

    expect(fakeQb.where).toHaveBeenCalled();
    // Ensure paginate called
    expect(paginateMock).toHaveBeenCalled();
  });
});
