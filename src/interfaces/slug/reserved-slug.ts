/**
 * Reserved Slug Interfaces
 *
 * Defines interfaces for reserved slug entries and related validation for job postings.
 * Supports validation and management of reserved slugs in the system.
 *
 * @module src/interfaces/slug/reserved-slug
 */

export interface ReservedSlugEntry {
  id: number;
  slug: string;
  reason: string;
  createdAt: Date;
}
