import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('job_slug_history', table => {
    table.bigIncrements('id').primary();
    table.bigInteger('job_posting_id').notNullable();
    table.string('old_slug', 100);
    table.string('new_slug', 100).notNullable();
    table
      .enu('change_reason', ['creation', 'title_update', 'manual_update', 'conflict_resolution'])
      .notNullable();
    table.bigInteger('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('job_posting_id').references('id').inTable('job_postings');
    table.foreign('created_by').references('id').inTable('users');
    table.index(['job_posting_id'], 'idx_slug_history_job');
    table.index(['old_slug'], 'idx_slug_history_old_slug');
    table.index(['new_slug'], 'idx_slug_history_new_slug');
    table.index(['created_at'], 'idx_slug_history_created');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_slug_history');
}
