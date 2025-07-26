import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`CREATE TYPE department_status AS ENUM ('active', 'inactive')`);

  await knex.schema.createTable('departments', table => {
    table.increments('id');
    table.string('name', 255).notNullable();
    table.text('description');
    table.specificType('status', 'department_status').defaultTo('active');
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index(['status'], 'idx_departments_status');
    table.index(['name'], 'idx_departments_name');
    table.index(['created_by'], 'idx_departments_created_by');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('departments');
  await knex.schema.raw('DROP TYPE IF EXISTS department_status');
}
