/**
 * Seeder Utilities
 *
 * Provides reusable helper functions for database seeders, including idempotent insert logic,
 * standardized Winston logging, error handling, and support for seeder profiles (minimal, standard, extensive, test).
 * Designed to keep all seeders modular, maintainable, and consistent with project architecture.
 *
 * @module src/utilities/seeder-utils
 */

import type { Knex } from 'knex';
import { defaultWinstonLogger as logger } from './winston-logger';

/**
 * Seeder profile types
 */
export type SeederProfile = 'minimal' | 'standard' | 'extensive' | 'test';

/**
 * Options for idempotent insert
 */
export interface IdempotentInsertOptions<T> {
  table: string;
  data: T[];
  conflictColumns: string[];
  logLabel?: string;
}

/**
 * Perform an idempotent insert for a batch of records.
 * Uses ON CONFLICT DO NOTHING to avoid duplicates.
 * Logs the operation and errors via Winston.
 */
export async function idempotentInsert<T>(
  knex: Knex,
  options: IdempotentInsertOptions<T>,
): Promise<number> {
  const { table, data, conflictColumns, logLabel } = options;
  if (!data.length) return 0;
  try {
    await knex(table).insert(data).onConflict(conflictColumns).ignore();
    logger.info(`${logLabel || table}: Inserted ${data.length} records (idempotent)`);
    return data.length;
  } catch (err) {
    logger.error(`${logLabel || table}: Failed to insert records`, { error: err });
    throw err;
  }
}

/**
 * Log a seeder operation with Winston
 */
export function logSeeder(message: string, meta?: Record<string, unknown>) {
  logger.info(`[Seeder] ${message}`, meta);
}

/**
 * Handle and log seeder errors
 */
export function handleSeederError(context: string, error: unknown) {
  logger.error(`[Seeder] ${context}: ${error instanceof Error ? error.message : String(error)}`, {
    error,
  });
}

/**
 * Get the current seeder profile from environment or default
 */
export function getSeederProfile(): SeederProfile {
  const profile = process.env.SEEDER_PROFILE as SeederProfile;
  if (profile && ['minimal', 'standard', 'extensive', 'test'].includes(profile)) {
    return profile;
  }
  return 'standard';
}
