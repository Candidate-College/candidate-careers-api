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

// Fungsi mapping dari DepartmentData (atau hasil query) ke resource
export function toDepartmentResource(dept: any): DepartmentResource {
  let jobPostingsCount = 0;
  if (Array.isArray(dept.job_postings_count)) {
    jobPostingsCount = Number(dept.job_postings_count[0]?.count || 0);
  } else if (typeof dept.job_postings_count === 'number') {
    jobPostingsCount = dept.job_postings_count;
  }
  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    status: dept.status,
    job_postings_count: jobPostingsCount,
    created_by: dept.created_by,
    created_at: dept.created_at instanceof Date ? dept.created_at.toISOString() : String(dept.created_at),
    updated_at: dept.updated_at instanceof Date ? dept.updated_at.toISOString() : String(dept.updated_at),
  };
}

export function toDepartmentListResource(paginated: any): DepartmentListResource {
  return {
    departments: (paginated.data || []).map(toDepartmentResource),
    pagination: {
      current_page: paginated.currentPage || paginated.current_page || 1,
      total_pages: paginated.totalPages || paginated.total_pages || 1,
      total_items: paginated.totalItems || paginated.total_items || 0,
      items_per_page: paginated.itemsPerPage || paginated.items_per_page || 10,
      has_next: paginated.hasNext || paginated.has_next || false,
      has_previous: paginated.hasPrevious || paginated.has_previous || false,
    },
  };
} 