import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('password_reset_tokens', table => {
    table.string('email', 255);
    table.text('token');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());;
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('password_reset_tokens');
}
