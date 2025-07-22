/**
 * Departments Seeder
 *
 * Seeds the departments table with at least 12 departments for development, testing, and demo environments.
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
    status: 'active',
  },
  {
    name: 'Engineering',
    description: 'Responsible for product development and technical innovation.',
    status: 'active',
  },
  {
    name: 'Marketing',
    description: 'Drives brand awareness and lead generation.',
    status: 'active',
  },
  {
    name: 'Sales',
    description: 'Manages client relationships and sales operations.',
    status: 'active',
  },
  {
    name: 'Finance',
    description: 'Oversees budgeting, accounting, and financial planning.',
    status: 'active',
  },
  {
    name: 'Customer Support',
    description: 'Provides assistance to users and resolves issues.',
    status: 'active',
  },
  { name: 'Legal', description: 'Ensures compliance and manages contracts.', status: 'inactive' },
  {
    name: 'Operations',
    description: 'Optimizes business processes and logistics.',
    status: 'inactive',
  },
  { name: 'IT', description: 'Maintains infrastructure and internal systems.', status: 'inactive' },
  {
    name: 'Product Management',
    description: 'Defines product vision and roadmap.',
    status: 'inactive',
  },
  { name: 'Research', description: 'Conducts research and development.', status: 'active' },
  {
    name: 'Procurement',
    description: 'Manages purchasing and vendor relations.',
    status: 'inactive',
  },
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
