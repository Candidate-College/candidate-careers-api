/**
 * Job Analytics Daily Migration
 *
 * Creates the job_analytics_daily table for daily job analytics aggregation.
 * Tracks total/unique views, applications, conversion rate, and timestamps per job per day.
 *
 * @module database/migrations/20250722160000_job_analytics_daily
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('job_analytics_daily', table => {
    table.bigIncrements('id');
    table
      .bigInteger('job_posting_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('job_postings')
      .onDelete('CASCADE');
    table.date('analytics_date').notNullable();
    table.integer('total_views').defaultTo(0);
    table.integer('unique_views').defaultTo(0);
    table.integer('total_applications').defaultTo(0);
    table.decimal('conversion_rate', 5, 2).defaultTo(0.0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['job_posting_id', 'analytics_date'], 'uk_job_analytics_daily');
    table.index(['analytics_date'], 'idx_job_analytics_date');
    table.index(['conversion_rate'], 'idx_job_analytics_conversion');
    table.index(['total_views'], 'idx_job_analytics_views');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_analytics_daily');
}
