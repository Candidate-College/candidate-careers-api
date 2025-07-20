/**
 * Pagination Utilities
 *
 * Provides reusable helper functions to apply offset/limit pagination to any
 * Objection.js / Knex query builder while returning a typed paginated result
 * object. Keeping pagination in a single utility promotes reuse across
 * repositories and maintains consistency.
 *
 * @module src/utilities/pagination
 */

import type { QueryBuilder } from 'objection';

export interface PaginationOptions {
  /** Page number (1-based). Defaults to 1. */
  page?: number;
  /** Page size (items per page). Defaults to 20. */
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 20;

/**
 * Apply pagination to a query builder and execute two queries:
 * 1) Count total rows
 * 2) Fetch paginated rows
 *
 * Returns a paginated result wrapper.
 *
 * NOTE: For performance-critical paths you may refactor to window functions,
 * but for admin dashboards & APIs this simple approach is fine.
 */
export async function paginate<T>(
  qb: QueryBuilder<any, T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(options.page ?? DEFAULT_PAGE, 1);
  const pageSize = Math.max(options.pageSize ?? DEFAULT_SIZE, 1);

  // Clone builder for count query (avoid modifying original)
  const countQb = qb.clone().clearSelect().count({ total: '*' }).first();
  const countRes: any = await countQb;
  const total = Number(countRes?.total ?? 0);

  const data = await qb.clone().limit(pageSize).offset((page - 1) * pageSize);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}
