import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_logs', table => {
    table.increments('id');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('action', 100).notNullable();
    table.string('subject_type', 100).notNullable();
    table.integer('subject_id').notNullable();
    table.text('description').notNullable();
    table.json('old_values');
    table.json('new_values');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());

    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity_logs');
}
