import type { Knex } from 'knex';

const foreigns = {
  id: 'user_id',
}

/**
 * User email verification attempt logs
 * 
 * @param knex 
 * @returns 
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('user_email_verifications', table => {
      table.increments('id');
      table.integer(foreigns.id).unsigned().notNullable();
      table.uuid('uuid').notNullable().unique();
      table.string('action').notNullable();
      table.string('user_agent');
      table.string('ip_address');
      table.timestamp('verified_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign(foreigns.id).references('id').inTable('users').onDelete('CASCADE');
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('user_email_verifications', table => {
    Object.values(foreigns).map(key => table.dropForeign(key))
  }).dropTableIfExists('user_email_verifications');
}
