import { JobCategoryRepository, ListJobCategoriesFilters } from '@/repositories/job-category-repository';
import { JobCategoryData } from '@/models/job-category-model';
import { 
  createError, 
  ErrorType,
  AppError 
} from '@/utilities/error-handler';
import { RolePermissionService } from '@/services/rbac/role-permission-service';

/**
 * Error thrown when job category name already exists
 */
export class JobCategoryNameConflictError extends Error {
  public readonly appError: AppError;
  
  constructor(name: string) {
    const message = `Job category name '${name}' must be unique`;
    super(message);
    
    this.name = 'JobCategoryNameConflictError';
    this.appError = createError(
      ErrorType.RESOURCE_CONFLICT,
      message,
      { name }
    );
  }
}

/**
 * Error thrown when job category is not found
 */
export class JobCategoryNotFoundError extends Error {
  public readonly appError: AppError;
  
  constructor(id: number) {
    const message = `Job category with ID ${id} not found`;
    super(message);
    
    this.name = 'JobCategoryNotFoundError';
    this.appError = createError(
      ErrorType.RESOURCE_NOT_FOUND,
      message,
      { id }
    );
  }
}

/**
 * Error thrown when job category cannot be deleted due to constraints
 */
export class JobCategoryDeletionConstraintError extends Error {
  public readonly appError: AppError;
  
  constructor(id: number) {
    const message = 'Job category cannot be deleted because it has active job postings';
    super(message);
    
    this.name = 'JobCategoryDeletionConstraintError';
    this.appError = createError(
      ErrorType.RESOURCE_CONFLICT,
      message,
      { id }
    );
  }
}

/**
 * Custom error for insufficient permissions
 */
export class JobCategoryInsufficientPermissionsError extends Error {
  public readonly appError: AppError;

  constructor(action: string) {
    const message = `Insufficient permissions to ${action} job categories`;
    super(message);
    this.name = 'JobCategoryInsufficientPermissionsError';
    this.appError = createError(
      ErrorType.INSUFFICIENT_PERMISSIONS,
      message,
      { action }
    );
  }
}

/**
 * Job Category Service
 * 
 * Handles business logic for job category operations including CRUD operations,
 * validation, authorization, and constraint checking.
 * 
 * @module services/job-category-service
 */
export class JobCategoryService {
  /**
   * Check if user has permission for job category operations
   * 
   * @param userId - User ID
   * @param permission - Permission to check (e.g., 'job_categories.create')
   * @returns Promise resolving to boolean
   */
  private static async hasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      return await RolePermissionService.hasPermission(userId, permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * List job categories with pagination, filter, sort, and search
   * 
   * @param query - Query parameters for filtering and pagination
   * @returns Promise resolving to paginated job categories
   */
  static async listJobCategories(query: Record<string, unknown>) {
    const filters: ListJobCategoriesFilters = {
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      search: query.search as string | undefined,
      status: query.status as 'active' | 'inactive' | undefined,
      sort: query.sort as 'name' | 'created_at' | undefined,
      order: query.order as 'asc' | 'desc' | undefined,
    };
    return JobCategoryRepository.list(filters);
  }

  /**
   * Search job categories by name/description (for suggestions/autocomplete)
   * 
   * @param query - Search query string
   * @param limit - Maximum number of results to return
   * @returns Promise resolving to array of job categories
   */
  static async searchJobCategories(query: string, limit = 10) {
    const filters: ListJobCategoriesFilters = {
      search: query,
      limit,
    };
    const result = await JobCategoryRepository.list(filters);
    return result.data;
  }

  /**
   * Get job category detail by id
   * 
   * @param id - Job category ID
   * @returns Promise resolving to job category or null if not found
   */
  static async getJobCategoryById(id: number) {
    return JobCategoryRepository.findById(id);
  }

  /**
   * Create job category (only super_admin, head_of_hr)
   * 
   * @param payload - Job category data
   * @param createdBy - ID of the user creating the job category
   * @returns Promise resolving to created job category
   * @throws {JobCategoryNameConflictError} If name is not unique
   * @throws {JobCategoryInsufficientPermissionsError} If user lacks permission
   */
  static async createJobCategory(payload: Partial<JobCategoryData>, createdBy: number) {
    // Authorization check
    const hasPermission = await this.hasPermission(createdBy, 'job_categories.create');
    if (!hasPermission) {
      throw new JobCategoryInsufficientPermissionsError('create');
    }

    // Validate unique name (case-insensitive)
    const exists = await JobCategoryRepository.existsByName(payload.name!);
    if (exists) {
      throw new JobCategoryNameConflictError(payload.name!);
    }
    
    const jobCategory = await JobCategoryRepository.create({
      ...payload,
      created_by: createdBy,
      status: payload.status ?? 'active',
      color_code: payload.color_code ?? '#007bff',
      created_at: new Date(),
      updated_at: new Date(),
    });
    return jobCategory;
  }

  /**
   * Update job category (only super_admin, head_of_hr)
   * 
   * @param id - Job category ID
   * @param payload - Updated job category data
   * @param updatedBy - ID of the user updating the job category
   * @returns Promise resolving to updated job category
   * @throws {JobCategoryNameConflictError} If name is not unique
   * @throws {JobCategoryNotFoundError} If job category not found
   * @throws {JobCategoryInsufficientPermissionsError} If user lacks permission
   */
  static async updateJobCategory(id: number, payload: Partial<JobCategoryData>, updatedBy: number) {
    // Authorization check
    const hasPermission = await this.hasPermission(updatedBy, 'job_categories.update');
    if (!hasPermission) {
      throw new JobCategoryInsufficientPermissionsError('update');
    }

    // Validate unique name (case-insensitive)
    if (payload.name) {
      const exists = await JobCategoryRepository.existsByName(payload.name, id);
      if (exists) {
        throw new JobCategoryNameConflictError(payload.name);
      }
    }
    
    const jobCategory = await JobCategoryRepository.updateById(id, {
      ...payload,
      updated_at: new Date(),
    });
    
    if (!jobCategory) {
      throw new JobCategoryNotFoundError(id);
    }
    
    return jobCategory;
  }

  /**
   * Delete job category (only super_admin, with constraint)
   * 
   * @param id - Job category ID
   * @param deletedBy - ID of the user deleting the job category
   * @returns Promise resolving to deleted job category
   * @throws {JobCategoryDeletionConstraintError} If category has active job postings
   * @throws {JobCategoryNotFoundError} If job category not found
   * @throws {JobCategoryInsufficientPermissionsError} If user lacks permission
   */
  static async deleteJobCategory(id: number, deletedBy: number) {
    // Authorization check
    const hasPermission = await this.hasPermission(deletedBy, 'job_categories.delete');
    if (!hasPermission) {
      throw new JobCategoryInsufficientPermissionsError('delete');
    }

    // Check constraint: cannot delete if there are active job postings
    const hasActive = await JobCategoryRepository.hasActiveJobPostings(id);
    if (hasActive) {
      throw new JobCategoryDeletionConstraintError(id);
    }
    
    const jobCategory = await JobCategoryRepository.softDeleteById(id);
    if (!jobCategory) {
      throw new JobCategoryNotFoundError(id);
    }
    
    return jobCategory;
  }

  /**
   * Change job category status (active/inactive)
   * 
   * @param id - Job category ID
   * @param status - New status
   * @param updatedBy - ID of the user updating the status
   * @returns Promise resolving to updated job category
   * @throws {JobCategoryNotFoundError} If job category not found
   * @throws {JobCategoryInsufficientPermissionsError} If user lacks permission
   */
  static async changeStatus(id: number, status: 'active' | 'inactive', updatedBy: number) {
    // Authorization check
    const hasPermission = await this.hasPermission(updatedBy, 'job_categories.update');
    if (!hasPermission) {
      throw new JobCategoryInsufficientPermissionsError('update status');
    }

    const jobCategory = await JobCategoryRepository.updateById(id, {
      status,
      updated_at: new Date(),
    });
    
    if (!jobCategory) {
      throw new JobCategoryNotFoundError(id);
    }
    
    return jobCategory;
  }
} 