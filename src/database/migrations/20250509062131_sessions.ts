import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sessions', table => {
    table.increments('id');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.text('payload').notNullable();
    table.integer('last_activity').notNullable();

    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('users');
}
