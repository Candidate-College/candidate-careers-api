import { UserManagementService } from '@/services/user/user-management-service';
import { UserRepository } from '@/repositories/user-repository';

jest.mock('@/repositories/user-repository');

describe('UserManagementService', () => {
  afterEach(() => jest.clearAllMocks());

  test('listUsers passes correct filters to repository', async () => {
    const spy = jest.spyOn(UserRepository, 'list').mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    } as any);

    const query = {
      page: '2',
      limit: '50',
      search: 'john',
      role_id: '3',
      status: 'active',
      created_from: '2025-01-01',
      created_to: '2025-02-01',
      sort_by: 'name',
      sort_order: 'asc',
    } as any;

    await UserManagementService.listUsers(query);

    expect(spy).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      search: 'john',
      role_id: 3,
      status: 'active',
      created_from: '2025-01-01',
      created_to: '2025-02-01',
      sort_by: 'name',
      sort_order: 'asc',
    });
  });
});
