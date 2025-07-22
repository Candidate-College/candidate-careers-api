/**
 * URL Construction Service
 *
 * Provides methods for generating public, admin, and shareable URLs for job postings.
 * Supports tracking parameters, environment-specific logic, and ensures SEO-friendly, consistent URL patterns.
 *
 * @module src/services/url-construction-service
 */

import {
  PublicUrlParams,
  AdminUrlParams,
  ShareableUrlParams,
} from '@/interfaces/slug/url-construction';
import { defaultWinstonLogger as logger } from '@/utilities/winston-logger';

const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://careers.example.com';
const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL || 'https://admin.careers.example.com';

export class URLConstructionService {
  /**
   * Private helper to validate string parameters (slug, uuid, etc.)
   */
  private static validateStringParam(param: string, paramName: string): void {
    if (!param || typeof param !== 'string') {
      logger.warn(`URLConstructionService: Invalid ${paramName}`, { [paramName]: param });
      throw new Error(`Invalid ${paramName} for URL`);
    }
  }

  /**
   * Generate the public URL for a job posting by slug.
   */
  public static generatePublicURL({ slug }: PublicUrlParams): string {
    this.validateStringParam(slug, 'slug');
    return `${PUBLIC_BASE_URL}/jobs/${encodeURIComponent(slug)}`;
  }

  /**
   * Generate the admin panel URL for a job posting by UUID.
   */
  public static generateAdminURL({ uuid }: AdminUrlParams): string {
    this.validateStringParam(uuid, 'uuid');
    return `${ADMIN_BASE_URL}/job-postings/${encodeURIComponent(uuid)}`;
  }

  /**
   * Generate a shareable URL for a job posting, with optional tracking parameters.
   */
  public static generateShareableURL({ slug, trackingParams }: ShareableUrlParams): string {
    // Use generatePublicURL to get the base URL
    const urlBase = this.generatePublicURL({ slug });
    let url = urlBase;
    if (trackingParams && typeof trackingParams === 'object') {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(trackingParams)) {
        params.append(key, String(value));
      }
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return url;
  }
}

export default URLConstructionService;
