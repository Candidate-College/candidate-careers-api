import { JobCategory, JobCategoryData } from '@/models/job-category-model';
import { QueryBuilder } from 'objection';
import { paginate, PaginatedResult } from '@/utilities/pagination';

export interface ListJobCategoriesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export class JobCategoryRepository {
  /** Base query untuk job category, join creator dan count job postings */
  private static baseQuery(): QueryBuilder<JobCategory, JobCategoryData[]> {
    return JobCategory.query()
      .select(
        'job_categories.id',
        'job_categories.name',
        'job_categories.description',
        'job_categories.status',
        'job_categories.color_code',
        'job_categories.created_by',
        'job_categories.created_at',
        'job_categories.updated_at',
        'job_categories.deleted_at',
        // Subquery count job postings
        JobCategory.relatedQuery('jobPostings')
          .count()
          .as('job_postings_count')
      )
      .withGraphFetched('creator');
  }

  /** List job categories dengan filter, search, sort, dan pagination */
  static async list(filters: ListJobCategoriesFilters): Promise<PaginatedResult<JobCategoryData>> {
    let qb = this.baseQuery();

    // Search by name/description
    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      qb = qb.where(builder =>
        builder
          .whereRaw('LOWER(job_categories.name) LIKE ?', [term])
          .orWhereRaw('LOWER(job_categories.description) LIKE ?', [term])
      );
    }

    // Filter by status
    if (filters.status) {
      qb = qb.where('job_categories.status', filters.status);
    }

    // Sorting
    const sortBy = filters.sort_by ?? 'created_at';
    const sortOrder = filters.sort_order ?? 'desc';
    qb = qb.orderBy(`job_categories.${sortBy}`, sortOrder);

    // Pagination
    return paginate(qb, { page: filters.page, pageSize: filters.limit });
  }

  /** Get job category by id (join creator) */
  static async findById(id: number): Promise<JobCategoryData | undefined> {
    return this.baseQuery().where('job_categories.id', id).first();
  }

  /** Create job category */
  static async create(data: Partial<JobCategoryData>) {
    return JobCategory.query().insertAndFetch(data);
  }

  /** Update job category */
  static async updateById(id: number, data: Partial<JobCategoryData>) {
    return JobCategory.query().patchAndFetchById(id, data);
  }

  /** Soft delete job category */
  static async softDeleteById(id: number) {
    return JobCategory.query().patchAndFetchById(id, { deleted_at: new Date() });
  }

  /** Cek nama unik (case-insensitive) */
  static async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let qb = JobCategory.query()
      .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
      .whereNull('deleted_at');
    if (excludeId) qb = qb.where('id', '!=', excludeId);
    const cat = await qb.first();
    return !!cat;
  }

  /** Cek constraint: apakah ada job posting aktif (published) yang pakai job category ini */
  static async hasActiveJobPostings(jobCategoryId: number): Promise<boolean> {
    const { JobPostings } = await import('@/models/job-posting-model');
    const count = await JobPostings.query()
      .where('job_category_id', jobCategoryId)
      .where('status', 'published')
      .whereNull('deleted_at')
      .resultSize();
    return count > 0;
  }
} 