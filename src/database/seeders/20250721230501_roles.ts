import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('roles').del();

  // Inserts seed entries
  await knex('roles').insert([
    { name: 'headhr', display_name: 'Head of HR' },
    { name: 'superadmin', display_name: 'Superadmin' },
    { name: 'hrstaff', display_name: 'HR Staff' },
  ]);
}
