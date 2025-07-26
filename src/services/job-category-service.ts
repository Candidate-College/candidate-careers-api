import { JobCategoryRepository, ListJobCategoriesFilters } from '@/repositories/job-category-repository';
import { JobCategoryData } from '@/models/job-category-model';
import { UserData } from '@/models/user-model';

export class JobCategoryService {
  /** List job categories with pagination, filter, sort, and search */
  static async listJobCategories(query: Record<string, unknown>) {
    const filters: ListJobCategoriesFilters = {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      search: query.search as string | undefined,
      status: query.status as 'active' | 'inactive' | undefined,
      sort_by: query.sort_by as 'name' | 'created_at' | undefined,
      sort_order: query.sort_order as 'asc' | 'desc' | undefined,
    };
    return JobCategoryRepository.list(filters);
  }

  /** Search job categories by name/description (for suggestions/autocomplete) */
  static async searchJobCategories(query: string, limit = 10) {
    const filters: ListJobCategoriesFilters = {
      search: query,
      limit,
    };
    const result = await JobCategoryRepository.list(filters);
    return result.data;
  }

  /** Get job category detail by id */
  static async getJobCategoryById(id: number) {
    return JobCategoryRepository.findById(id);
  }

  /** Create job category (only super_admin, head_of_hr) */
  static async createJobCategory(payload: Partial<JobCategoryData>, createdBy: UserData) {
    // Validasi nama unik (case-insensitive)
    const exists = await JobCategoryRepository.existsByName(payload.name!);
    if (exists) {
      throw new Error('Job category name must be unique');
    }
    const jobCategory = await JobCategoryRepository.create({
      ...payload,
      created_by: createdBy.id,
      status: payload.status ?? 'active',
      color_code: payload.color_code ?? '#007bff',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return jobCategory;
  }

  /** Update job category (only super_admin, head_of_hr) */
  static async updateJobCategory(id: number, payload: Partial<JobCategoryData>, updatedBy: UserData) {
    // Validasi nama unik (case-insensitive)
    if (payload.name) {
      const exists = await JobCategoryRepository.existsByName(payload.name, id);
      if (exists) {
        throw new Error('Job category name must be unique');
      }
    }
    const jobCategory = await JobCategoryRepository.updateById(id, {
      ...payload,
      updated_at: new Date(),
    });
    if (!jobCategory) throw new Error('Job category not found');
    return jobCategory;
  }

  /** Delete job category (only super_admin, with constraint) */
  static async deleteJobCategory(id: number, deletedBy: UserData) {
    // Cek constraint: tidak boleh hapus jika ada job posting aktif
    const hasActive = await JobCategoryRepository.hasActiveJobPostings(id);
    if (hasActive) {
      throw new Error('Job category cannot be deleted because it has active job postings');
    }
    const jobCategory = await JobCategoryRepository.softDeleteById(id);
    if (!jobCategory) throw new Error('Job category not found');
    return jobCategory;
  }

  /** Change job category status (active/inactive) */
  static async changeStatus(id: number, status: 'active' | 'inactive', updatedBy: UserData) {
    const jobCategory = await JobCategoryRepository.updateById(id, {
      status,
      updated_at: new Date(),
    });
    if (!jobCategory) throw new Error('Job category not found');
    return jobCategory;
  }
} 