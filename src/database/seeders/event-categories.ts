import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('event_categories').del();

  const names = ['Online', 'On-Site', 'Hybrid'];
  const records = names.map(name => ({ name }));

  // Inserts seed entries
  await knex('event_categories').insert(records);
};
