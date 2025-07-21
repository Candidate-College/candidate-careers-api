/**
 * Job Categories Seeder
 *
 * Seeds the job_categories table with realistic sample data for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses seeder-utils for logging and error handling.
 *
 * @module src/database/seeders/job-categories
 */

import type { Knex } from 'knex';
import {
  idempotentInsert,
  logSeeder,
  handleSeederError,
  getSeederProfile,
} from '../../utilities/seeder-utils';

const jobCategories = [
  {
    name: 'Software Engineering',
    slug: 'software-engineering',
    description: 'Development of software products and systems.',
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Analysis and interpretation of complex data.',
  },
  {
    name: 'Product Management',
    slug: 'product-management',
    description: 'Overseeing product development and strategy.',
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    description: 'Promoting products and building brand awareness.',
  },
  { name: 'Sales', slug: 'sales', description: 'Driving revenue through client acquisition.' },
  {
    name: 'Customer Success',
    slug: 'customer-success',
    description: 'Ensuring customer satisfaction and retention.',
  },
  { name: 'Finance', slug: 'finance', description: 'Managing company finances and investments.' },
  {
    name: 'Human Resources',
    slug: 'human-resources',
    description: 'Recruitment and employee management.',
  },
  { name: 'Design', slug: 'design', description: 'Creating visual and user experience designs.' },
  { name: 'Operations', slug: 'operations', description: 'Streamlining business processes.' },
];

export async function seed(knex: Knex): Promise<void> {
  try {
    await idempotentInsert(knex, {
      table: 'job_categories',
      data: jobCategories,
      conflictColumns: ['slug'],
      logLabel: 'job_categories',
    });
    logSeeder('Seeded job_categories table');
  } catch (error) {
    handleSeederError('job_categories', error);
    throw error;
  }
}
