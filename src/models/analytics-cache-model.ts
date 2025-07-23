/**
 * AnalyticsCache Model
 *
 * Represents a cached analytics query result for performance optimization.
 * Used to store and retrieve analytics data by cache key and expiration.
 *
 * @module models/analytics-cache-model
 */

const Model = require('@/config/database/orm');

export class AnalyticsCache extends Model {
  static tableName = 'analytics_cache';
  static idColumn = 'cache_key';
}
