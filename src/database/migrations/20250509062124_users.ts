import type { Knex } from 'knex';

const enums = {
  role: 'users_role',
};

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('users', table => {
      table.increments('id');
      table.string('email', 255).notNullable().unique();
      table.string('password', 255).notNullable();
      table.string('name', 255).notNullable();
      table.enum('role', ['member', 'admin'], { useNative: true, enumName: enums.role }).defaultTo('member');
      table.timestamp('email_verified_at');
      table.timestamps(true, true);
      table.timestamp('deleted_at');
    });
}

export async function down(knex: Knex): Promise<void> {
  console.log('Dropping migration...');
  await knex.schema.dropTableIfExists('users');

  for (const typeName of Object.values(enums)) {
    console.log(typeName);
    await knex.schema.raw(`DROP TYPE IF EXISTS "${typeName}"`);
  }
}
