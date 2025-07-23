/**
 * Department Analytics Daily Migration
 *
 * Creates the department_analytics_daily table for daily department analytics aggregation.
 * Tracks total jobs, views, applications, average conversion rate, and timestamps per department per day.
 *
 * @module database/migrations/20250722160100_department_analytics_daily
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('department_analytics_daily', table => {
    table.bigIncrements('id');
    table
      .bigInteger('department_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('departments')
      .onDelete('CASCADE');
    table.date('analytics_date').notNullable();
    table.integer('total_jobs').defaultTo(0);
    table.integer('total_views').defaultTo(0);
    table.integer('total_applications').defaultTo(0);
    table.decimal('average_conversion_rate', 5, 2).defaultTo(0.0);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.unique(['department_id', 'analytics_date'], { indexName: 'uk_dept_analytics_daily' });
    table.index(['analytics_date'], 'idx_dept_analytics_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('department_analytics_daily');
}
