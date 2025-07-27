import { JobCategoryData } from '@/models/job-category-model';
import { PaginatedResult } from '@/utilities/pagination';

export interface JobCategoryResource {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  color_code: string;
  job_postings_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface JobCategoryListResource {
  job_categories: JobCategoryResource[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

/**
 * Mapping function from JobCategoryData (or query result) to resource
 * @param cat - Job category data from database
 * @returns Formatted job category resource
 */
export function toJobCategoryResource(cat: JobCategoryData): JobCategoryResource {
  let jobPostingsCount = 0;
  
  if (cat.job_postings_count) {
    if (Array.isArray(cat.job_postings_count)) {
      jobPostingsCount = Number(cat.job_postings_count[0]?.count || 0);
    } else if (typeof cat.job_postings_count === 'number') {
      jobPostingsCount = cat.job_postings_count;
    }
  }
  
  return {
    id: cat.id,
    name: cat.name,
    description: cat.description,
    status: cat.status,
    color_code: cat.color_code,
    job_postings_count: jobPostingsCount,
    created_by: cat.created_by,
    created_at: cat.created_at instanceof Date ? cat.created_at.toISOString() : String(cat.created_at),
    updated_at: cat.updated_at instanceof Date ? cat.updated_at.toISOString() : String(cat.updated_at),
  };
}

/**
 * Mapping function from paginated job category data to list resource
 * @param paginated - Paginated result from repository
 * @returns Formatted job category list resource
 */
export function toJobCategoryListResource(paginated: PaginatedResult<JobCategoryData>): JobCategoryListResource {
  return {
    job_categories: (paginated.data || []).map(toJobCategoryResource),
    pagination: {
      current_page: paginated.page,
      total_pages: paginated.totalPages,
      total_items: paginated.total,
      items_per_page: paginated.pageSize,
      has_next: paginated.page < paginated.totalPages,
      has_previous: paginated.page > 1,
    },
  };
} 