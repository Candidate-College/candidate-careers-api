/**
 * AnalyticsCacheRepository
 *
 * Repository for analytics cache storage and retrieval.
 * Provides methods for upserting cache, retrieving by key, and deleting expired cache entries.
 *
 * @module repositories/analytics-cache-repository
 */

import { AnalyticsCache } from '@/models/analytics-cache-model';

export class AnalyticsCacheRepository {
  static async upsertCache(
    cacheKey: string,
    cacheData: any,
    expiresAt: Date,
  ): Promise<AnalyticsCache> {
    return await AnalyticsCache.query()
      .insert({ cache_key: cacheKey, cache_data: cacheData, expires_at: expiresAt })
      .onConflict('cache_key')
      .merge();
  }

  static async getCacheByKey(cacheKey: string): Promise<AnalyticsCache | undefined> {
    return await AnalyticsCache.query().findById(cacheKey);
  }

  static async deleteExpiredCache(now: Date): Promise<number> {
    return await AnalyticsCache.query().delete().where('expires_at', '<', now);
  }
}
