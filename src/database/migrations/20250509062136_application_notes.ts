import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('application_notes', table => {
    table.increments('id');
    table
      .integer('application_id')
      .unsigned()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.text('note').notNullable();
    table.boolean('is_internal').defaultTo(true);

    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true });

    table.unique(['application_id', 'user_id', 'note']); // Add composite unique constraint
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('application_notes');
}
