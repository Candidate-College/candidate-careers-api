import 'tsconfig-paths/register';
import type { Knex } from 'knex';
import { UserSession } from '@/models/user-session-model';
import { User } from '@/models/user-model';

const tableName = UserSession.tableName;

const foreigns = {
  user: { id: 'user_id' },
};

const indexes = ['user_id', 'is_active', 'created_at'];

/**
 * User session logs
 * 
 * @param knex 
 * @returns 
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(tableName, table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.integer(foreigns.user.id).notNullable().references('id').inTable(User.tableName).onDelete('CASCADE');

      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('last_used_at').nullable();
      table.timestamp('revoked_at').nullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      
      table.uuid('replaced_by').nullable().references('id').inTable(tableName);

      table.string('user_agent');
      table.string('ip_address');

      // Indexes for performance
      table.index(indexes);
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('user_sessions', table => {
    for (const foreign in foreigns) {
      Object.values(foreign).map(key => table.dropForeign(key))
    }
    indexes.forEach(index => table.dropIndex(index));
  }).dropTableIfExists('user_sessions');
}
