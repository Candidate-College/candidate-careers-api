import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`CREATE TYPE job_category_status AS ENUM ('active', 'inactive')`);

  await knex.schema.createTable('job_categories', table => {
    table.increments('id');
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description');
    table.specificType('status', 'job_category_status').defaultTo('active');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('job_categories');
  await knex.schema.raw('DROP TYPE IF EXISTS job_category_status');
}
