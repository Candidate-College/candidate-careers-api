/**
 * URL Construction Interfaces
 *
 * Defines interfaces for constructing public, admin, and shareable URLs for job postings.
 * Ensures type safety and flexibility for URL generation services.
 *
 * @module src/interfaces/slug/url-construction
 */

export interface PublicUrlParams {
  slug: string;
}

export interface AdminUrlParams {
  uuid: string;
}

export interface ShareableUrlParams {
  slug: string;
  trackingParams?: Record<string, string | number>;
}
