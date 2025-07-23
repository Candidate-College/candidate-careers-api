/**
 * Job Status Transitions Table Migration
 *
 * Creates the job_status_transitions table for tracking job posting status changes.
 *
 * @module database/migrations/20250722151000_job_status_transitions_table
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('job_status_transitions', table => {
    table.bigIncrements('id').primary();
    table
      .integer('job_posting_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('job_postings')
      .onDelete('CASCADE');
    table.enu('from_status', ['draft', 'published', 'closed', 'archived']).notNullable();
    table.enu('to_status', ['draft', 'published', 'closed', 'archived']).notNullable();
    table.string('transition_reason', 500);
    table.json('transition_data');
    table.bigInteger('created_by').unsigned().notNullable().references('id').inTable('users');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.index(['job_posting_id']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_status_transitions');
}
