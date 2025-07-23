/**
 * Add Workflow Fields to Job Postings Migration
 *
 * Adds workflow-related fields to the job_postings table for status management.
 *
 * @module database/migrations/20250722150000_job_postings_workflow_fields
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('job_postings', table => {
    table.enu('previous_status', ['draft', 'published', 'closed', 'archived']).nullable();
    table.timestamp('status_changed_at', { useTz: true }).nullable();
    table.bigInteger('status_changed_by').unsigned().references('id').inTable('users').nullable();
    table
      .enu('close_reason', [
        'position_filled',
        'budget_constraints',
        'requirements_changed',
        'cancelled',
      ])
      .nullable();
    table.text('close_notes', 'longtext').nullable();
    table.string('archive_reason', 500).nullable();
    table.timestamp('scheduled_publish_at', { useTz: true }).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('job_postings', table => {
    table.dropColumn('previous_status');
    table.dropColumn('status_changed_at');
    table.dropColumn('status_changed_by');
    table.dropColumn('close_reason');
    table.dropColumn('close_notes');
    table.dropColumn('archive_reason');
    table.dropColumn('scheduled_publish_at');
  });
}
