import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('events').del();

  // Inserts seed entries
  await knex('events').insert([
    { category_id: 1, slug: 'test-event', title: 'Test Event', description: 'This is a test event', starts_at: '2025-12-12', ends_at: '2025-12-13' },
  ]);
};
