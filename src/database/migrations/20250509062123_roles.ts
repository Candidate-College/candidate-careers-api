import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('roles', (table) => {
    table.bigIncrements('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('display_name', 100).notNullable();
    table.text('description').nullable();
    table.jsonb('permissions').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable();
  });

  await knex.schema.raw('CREATE UNIQUE INDEX roles_name_unique_idx ON roles(name)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('roles');
}
