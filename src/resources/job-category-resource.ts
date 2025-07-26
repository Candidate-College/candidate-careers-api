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

// Fungsi mapping dari JobCategoryData (atau hasil query) ke resource
export function toJobCategoryResource(cat: any): JobCategoryResource {
  let jobPostingsCount = 0;
  if (Array.isArray(cat.job_postings_count)) {
    jobPostingsCount = Number(cat.job_postings_count[0]?.count || 0);
  } else if (typeof cat.job_postings_count === 'number') {
    jobPostingsCount = cat.job_postings_count;
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

export function toJobCategoryListResource(paginated: any): JobCategoryListResource {
  return {
    job_categories: (paginated.data || []).map(toJobCategoryResource),
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