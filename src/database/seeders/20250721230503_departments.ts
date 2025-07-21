/**
 * Departments Seeder
 *
 * Seeds the departments table with realistic sample data for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses seeder-utils for logging and error handling.
 *
 * @module src/database/seeders/departments
 */

import type { Knex } from 'knex';
import {
  idempotentInsert,
  logSeeder,
  handleSeederError,
  getSeederProfile,
} from '../../utilities/seeder-utils';

const departments = [
  {
    name: 'Human Resources',
    description: 'Handles recruitment, onboarding, and employee relations.',
  },
  {
    name: 'Engineering',
    description: 'Responsible for product development and technical innovation.',
  },
  { name: 'Marketing', description: 'Drives brand awareness and lead generation.' },
  { name: 'Sales', description: 'Manages client relationships and sales operations.' },
  { name: 'Finance', description: 'Oversees budgeting, accounting, and financial planning.' },
  { name: 'Customer Support', description: 'Provides assistance to users and resolves issues.' },
  { name: 'Legal', description: 'Ensures compliance and manages contracts.' },
  { name: 'Operations', description: 'Optimizes business processes and logistics.' },
  { name: 'IT', description: 'Maintains infrastructure and internal systems.' },
  { name: 'Product Management', description: 'Defines product vision and roadmap.' },
];

export async function seed(knex: Knex): Promise<void> {
  try {
    await idempotentInsert(knex, {
      table: 'departments',
      data: departments,
      conflictColumns: ['name'],
      logLabel: 'departments',
    });
    logSeeder('Seeded departments table');
  } catch (error) {
    handleSeederError('departments', error);
    throw error;
  }
}
