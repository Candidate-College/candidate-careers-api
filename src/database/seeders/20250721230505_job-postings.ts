/**
 * Job Postings Seeder
 *
 * Seeds the job_postings table with realistic sample data for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses seeder-utils for logging and error handling.
 *
 * @module src/database/seeders/job-postings
 */

import type { Knex } from 'knex';
import { idempotentInsert, logSeeder, handleSeederError } from '../../utilities/seeder-utils';

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seed(knex: Knex): Promise<void> {
  try {
    const departments = await knex('departments').select('id');
    const jobCategories = await knex('job_categories').select('id');
    if (!departments.length || !jobCategories.length)
      throw new Error('Departments or job categories missing');

    const postings = Array.from({ length: 10 }).map((_, i) => {
      const department = randomFromArray(departments);
      const category = randomFromArray(jobCategories);
      return {
        title: `Job Posting ${i + 1}`,
        slug: `job-posting-${i + 1}`,
        department_id: department.id,
        job_category_id: category.id,
        job_type: 'staff',
        employment_level: 'mid',
        priority_level: 'normal',
        description: `Description for job posting ${i + 1}`,
        requirements: `Requirements for job posting ${i + 1}`,
        responsibilities: `Responsibilities for job posting ${i + 1}`,
        benefits: 'Standard benefits',
        team_info: 'Team info',
        salary_min: 5000000,
        salary_max: 10000000,
        is_salary_negotiable: true,
        location: 'Jakarta',
        is_remote: false,
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        max_applications: 100,
        status: 'published',
        views_count: 0,
        applications_count: 0,
        created_by: 1,
        updated_by: 1,
      };
    });

    await idempotentInsert(knex, {
      table: 'job_postings',
      data: postings,
      conflictColumns: ['slug'],
      logLabel: 'job_postings',
    });
    logSeeder('Seeded job_postings table');
  } catch (error) {
    handleSeederError('job_postings', error);
    throw error;
  }
}
