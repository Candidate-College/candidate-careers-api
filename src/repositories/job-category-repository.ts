import { JobCategory, JobCategoryData } from '@/models/job-category-model';
import { QueryBuilder, raw } from 'objection';
import { paginate, PaginatedResult } from '@/utilities/pagination';
import { Job } from '@/models/job-model';

export interface ListJobCategoriesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sort?: 'name' | 'created_at';
  order?: 'asc' | 'desc';
}

export class JobCategoryRepository {
  /** Base query for job category, join creator and count job postings */
  private static baseQuery(): QueryBuilder<JobCategory, JobCategoryData[]> {
    return JobCategory.query()
      .select(
        'job_categories.*',
        // Count job postings using a join and group by
        raw('COUNT(jobs.id) as job_postings_count')
      )
      .leftJoin('jobs', 'job_categories.id', 'jobs.job_category_id')
      .groupBy('job_categories.id')
      .withGraphFetched('creator');
  }

  /** List job categories with filter, search, sort, and pagination */
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
    const sortBy = filters.sort ?? 'created_at';
    const sortOrder = filters.order ?? 'desc';
    qb = qb.orderBy(`job_categories.${sortBy}`, sortOrder);

    // Pagination
    return paginate(qb, { page: filters.page, pageSize: filters.limit });
  }

  /** Get job category by id (join creator) */
  static async findById(id: number): Promise<JobCategoryData | undefined> {
    // The baseQuery now uses groupBy, so it's safer to have a dedicated findById
    // that also performs the count efficiently.
    const result = await JobCategory.query()
      .findById(id)
      .select('job_categories.*', raw('COUNT(jobs.id) as job_postings_count'))
      .leftJoin('jobs', 'job_categories.id', 'jobs.job_category_id')
      .groupBy('job_categories.id')
      .withGraphFetched('creator');
    
    // The result from Objection might be an array-like object with extra properties.
    // Ensure we return a plain object or undefined.
    return result as JobCategoryData | undefined;
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

  /** Check unique name (case-insensitive) */
  static async existsByName(name: string, excludeId?: number): Promise<boolean> {
    let qb = JobCategory.query()
      .whereRaw('LOWER(name) = ?', [name.toLowerCase()])
      .whereNull('deleted_at');
    if (excludeId) qb = qb.where('id', '!=', excludeId);
    const cat = await qb.first();
    return !!cat;
  }

  /** Check constraint: whether there are active job postings (published) using this job category */
  static async hasActiveJobPostings(jobCategoryId: number): Promise<boolean> {
    const count = await Job.query()
      .where('job_category_id', jobCategoryId)
      .where('status', 'published')
      .whereNull('deleted_at')
      .count('* as count')
      .first();
    
    return Number(count?.count || 0) > 0;
  }
} 