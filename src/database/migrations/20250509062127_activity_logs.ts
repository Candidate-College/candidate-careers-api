export const config = { transaction: false };

/**
 * Enhanced Activity Logs Migration
 *
 * Creates comprehensive activity_logs table with enhanced schema for
 * audit logging system. Includes enum types for categorization,
 * severity levels, and status tracking with proper indexes.
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum types for better data integrity
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'severity_level') THEN
        CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
      END IF;
    END$$;
  `);
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_category') THEN
        CREATE TYPE activity_category AS ENUM ('authentication', 'authorization', 'user_management', 'data_modification', 'system', 'security');
      END IF;
    END$$;
  `);
  await knex.schema.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_status') THEN
        CREATE TYPE activity_status AS ENUM ('success', 'failure', 'error');
      END IF;
    END$$;
  `);

  // Create enhanced activity_logs table
  await knex.schema.createTable('activity_logs', table => {
    // Primary key
    table.bigIncrements('id');

    // Foreign key relationships
    table
      .bigInteger('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('session_id', 255).nullable();

    // Core activity fields
    table.string('action', 100).notNullable();
    table.string('resource_type', 100).notNullable();
    table.bigInteger('resource_id').nullable();
    table.string('resource_uuid', 36).nullable();
    table.text('description').notNullable();

    // Data change tracking
    table.json('old_values').nullable();
    table.json('new_values').nullable();
    table.json('metadata').nullable();

    // Request metadata
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();

    // Categorization and severity
    table.specificType('severity', 'severity_level').defaultTo('medium');
    table.specificType('category', 'activity_category').notNullable();
    table.specificType('status', 'activity_status').defaultTo('success');

    // Timestamp
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    // Performance indexes
    table.index(['user_id']);
    table.index(['action']);
    table.index(['resource_type']);
    table.index(['category', 'severity']);
    table.index(['created_at']);
    table.index(['ip_address']);
    table.index(['session_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop table first
  await knex.schema.dropTableIfExists('activity_logs');

  // Drop enum types
  await knex.schema.raw('DROP TYPE IF EXISTS severity_level');
  await knex.schema.raw('DROP TYPE IF EXISTS activity_category');
  await knex.schema.raw('DROP TYPE IF EXISTS activity_status');
}
