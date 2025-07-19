import 'tsconfig-paths/register';
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('roles').del();

  // Inserts seed entries
  await knex('roles').insert([
    { name: 'guest', display_name: 'Guest' },
    { name: 'superadmin', display_name: 'Superadmin' },
    { name: 'recruiter', display_name: 'Recruiter' },
  ]);
};
