/**
 * Application Notes Seeder
 *
 * Seeds the application_notes table with realistic sample data for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses seeder-utils for logging and error handling.
 *
 * @module src/database/seeders/application-notes
 */

import type { Knex } from 'knex';
import { idempotentInsert, logSeeder, handleSeederError } from '../../utilities/seeder-utils';

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seed(knex: Knex): Promise<void> {
  try {
    const applications = await knex('job_applications').select('id');
    const users = await knex('users').select('id');
    if (!applications.length || !users.length) {
      logSeeder('Skipped seeding application_notes: applications or users missing');
      return;
    }

    const notes = Array.from({ length: 10 }).map((_, i) => {
      const application = randomFromArray(applications);
      const user = randomFromArray(users);
      return {
        application_id: application.id,
        user_id: user.id,
        note: `This is note ${i + 1} for application ${application.id}`,
        is_internal: i % 2 === 0,
      };
    });

    await idempotentInsert(knex, {
      table: 'application_notes',
      data: notes,
      conflictColumns: ['application_id', 'user_id', 'note'],
      logLabel: 'application_notes',
    });
    logSeeder('Seeded application_notes table');
  } catch (error) {
    handleSeederError('application_notes', error);
    throw error;
  }
}
