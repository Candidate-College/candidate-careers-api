import { Department, DepartmentData } from '@/models/department-model';
import { QueryBuilder } from 'objection';
import { paginate, PaginatedResult } from '@/utilities/pagination';

export interface ListDepartmentsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sort?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

export class DepartmentRepository {
  /** Base query untuk department, join creator (user pembuat) */
  private static baseQuery(): QueryBuilder<Department, DepartmentData[]> {
    return Department.query()
      .select(
        'departments.id',
        'departments.name',
        'departments.description',
        'departments.status',
        'departments.created_by',
        'departments.created_at',
        'departments.updated_at',
        'departments.deleted_at',
        // Subquery count job postings
        Department.relatedQuery('jobPostings')
          .count()
          .as('job_postings_count')
      )
      .withGraphFetched('creator');
  }

  /** List departments dengan filter, search, sort, dan pagination */
  static async list(filters: ListDepartmentsFilters): Promise<PaginatedResult<DepartmentData>> {
    let qb = this.baseQuery();

    // Search by name only
    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb = qb.whereRaw('LOWER(departments.name) LIKE ?', [term]);
    }

    // Filter by status
    if (filters.status) {
      qb = qb.where('departments.status', filters.status);
    }

    // Sorting
    const sortBy = filters.sort ?? 'created_at';
    const sortOrder = filters.order ?? 'desc';
    qb = qb.orderBy(`departments.${sortBy}`, sortOrder);

    // Pagination
    return paginate(qb, { page: filters.page, pageSize: filters.limit });
  }

  /** Get department by id (join creator) */
  static async findById(id: number): Promise<DepartmentData | undefined> {
    return this.baseQuery().where('departments.id', id).first();
  }

  /** Create department */
  static async create(data: Partial<DepartmentData>) {
    return Department.query().insertAndFetch(data);
  }

  /** Update department */
  static async updateById(id: number, data: Partial<DepartmentData>) {
    return Department.query().patchAndFetchById(id, data);
  }

  /** Soft delete department */
  static async softDeleteById(id: number) {
    return Department.query().patchAndFetchById(id, { deleted_at: new Date() });
  }

  /** Check unique name (case-insensitive) */
  static async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let qb = Department.query()
      .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
      .whereNull('deleted_at');
    if (excludeId) qb = qb.where('id', '!=', excludeId);
    const dept = await qb.first();
    return !!dept;
  }

  /** Check constraint: whether there are active (published) job postings using this department */
  static async hasActiveJobPostings(departmentId: number): Promise<boolean> {
    const { JobPostings } = await import('@/models/job-posting-model');
    const count = await JobPostings.query()
      .where('department_id', departmentId)
      .where('status', 'published')
      .whereNull('deleted_at')
      .resultSize();
    return count > 0;
  }
} 