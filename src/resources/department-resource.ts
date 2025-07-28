import { DepartmentData } from '@/models/department-model';
import { PaginatedResult } from '@/utilities/pagination';

export interface DepartmentResource {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  job_postings_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentListResource {
  departments: DepartmentResource[];
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
 * Mapping function from DepartmentData (or query result) to resource
 * @param dept - Department data from database
 * @returns Formatted department resource
 */
export function toDepartmentResource(dept: DepartmentData): DepartmentResource {
  let jobPostingsCount = 0;
  
  if (dept.job_postings_count) {
    if (Array.isArray(dept.job_postings_count)) {
      jobPostingsCount = Number(dept.job_postings_count[0]?.count || 0);
    } else if (typeof dept.job_postings_count === 'number') {
      jobPostingsCount = dept.job_postings_count;
    }
  }
  
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    status: dept.status,
    job_postings_count: jobPostingsCount,
    created_by: dept.created_by || 0,
    created_at: dept.created_at instanceof Date ? dept.created_at.toISOString() : String(dept.created_at),
    updated_at: dept.updated_at instanceof Date ? dept.updated_at.toISOString() : String(dept.updated_at),
  };
}

/**
 * Mapping function from paginated department data to list resource
 * @param paginated - Paginated result from repository
 * @returns Formatted department list resource
 */
export function toDepartmentListResource(paginated: PaginatedResult<DepartmentData>): DepartmentListResource {
  return {
    departments: (paginated.data || []).map(toDepartmentResource),
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