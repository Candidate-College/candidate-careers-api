/**
 * Analytics Cache Migration
 *
 * Creates the analytics_cache table for caching analytics query results.
 * Stores cache key, data, expiration, and timestamps.
 *
 * @module database/migrations/20250722160200_analytics_cache
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('analytics_cache', table => {
    table.string('cache_key', 255).primary();
    table.json('cache_data').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.index(['expires_at'], 'idx_analytics_cache_expires');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('analytics_cache');
}
