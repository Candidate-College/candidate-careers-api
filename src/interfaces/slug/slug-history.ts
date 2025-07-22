/**
 * Slug History Interfaces
 *
 * Defines interfaces for tracking and retrieving slug history for job postings.
 * Supports SEO, analytics, and redirect functionality.
 *
 * @module src/interfaces/slug/slug-history
 */

export type SlugChangeReason =
  | 'creation'
  | 'title_update'
  | 'manual_update'
  | 'conflict_resolution';

export interface SlugHistoryRecord {
  id: number;
  jobPostingId: number;
  oldSlug: string | null;
  newSlug: string;
  changeReason: SlugChangeReason;
  createdBy?: number;
  createdAt: Date;
}
