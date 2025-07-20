import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended')`);

  await knex.schema.createTable('users', table => {
    table.increments('id');
    table.uuid('uuid').notNullable().defaultTo(knex.raw('gen_random_uuid()')).unique();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('name', 255).notNullable();

    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.specificType('status', 'user_status').defaultTo('inactive');

    table.timestamp('email_verified_at', { useTz: true });
    table.timestamp('last_login_at', { useTz: true });
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.index(['role_id']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.raw('DROP TYPE IF EXISTS user_status');
  await knex.schema.dropTableIfExists('roles');
}
