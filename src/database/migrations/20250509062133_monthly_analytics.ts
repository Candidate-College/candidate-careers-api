import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('monthly_analytics', table => {
    table.increments('id');
    table.integer('year').notNullable();
    table.integer('month').notNullable();
    table.integer('total_job_postings').defaultTo(0);
    table.integer('total_applications').defaultTo(0);
    table.integer('total_approved_applications').defaultTo(0);
    table.integer('total_rejected_applications').defaultTo(0);
    table.integer('total_job_views').defaultTo(0);
    table.decimal('avg_applications_per_job', 8, 2).defaultTo(0);
    table.integer('top_department_id').unsigned().references('id').inTable('departments').onDelete('CASCADE');
    table.integer('top_job_category_id').unsigned().references('id').inTable('job_categories').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('monthly_analytics');
}
