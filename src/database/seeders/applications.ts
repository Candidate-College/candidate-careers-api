/**
 * Applications Seeder
 *
 * Seeds the applications table with realistic sample data for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses seeder-utils for logging and error handling.
 *
 * @module src/database/seeders/applications
 */

import type { Knex } from 'knex';
import { idempotentInsert, logSeeder, handleSeederError } from '@/utilities/seeder-utils';

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seed(knex: Knex): Promise<void> {
  try {
    const jobPostings = await knex('job_postings').select('id');
    const users = await knex('users').select('id', 'email', 'name');
    if (!jobPostings.length || !users.length) throw new Error('Job postings or users missing');

    const applications = Array.from({ length: 10 }).map((_, i) => {
      const job = randomFromArray(jobPostings);
      const user = randomFromArray(users);
      return {
        job_posting_id: job.id,
        application_number: `APP-${1000 + i}`,
        email: user.email,
        full_name: user.name,
        domicile: 'Jakarta',
        university: 'Universitas Indonesia',
        major: 'Computer Science',
        semester: '6',
        instagram_url: 'https://instagram.com/example',
        whatsapp_number: '08123456789',
        cv_url: 'https://example.com/cv.pdf',
        cv_filename: 'cv.pdf',
        portfolio_url: 'https://example.com/portfolio.pdf',
        portfolio_filename: 'portfolio.pdf',
        proof_follow_cc_ig_url: 'https://example.com/ig-proof.jpg',
        proof_follow_cc_ig_filename: 'ig-proof.jpg',
        proof_follow_cc_tiktok_url: 'https://example.com/tiktok-proof.jpg',
        proof_follow_cc_tiktok_filename: 'tiktok-proof.jpg',
        proof_follow_cc_x_url: 'https://example.com/x-proof.jpg',
        proof_follow_cc_x_filename: 'x-proof.jpg',
        proof_follow_ig_sequoia_url: 'https://example.com/sequoia-proof.jpg',
        proof_follow_ig_sequoia_filename: 'sequoia-proof.jpg',
        proof_follow_ig_sm_url: 'https://example.com/sm-proof.jpg',
        proof_follow_ig_sm_filename: 'sm-proof.jpg',
        status: 'pending',
        rejection_reason: null,
        approved_at: null,
        rejected_at: null,
        reviewed_by: null,
        reviewed_at: null,
        approval_email_sent: false,
        approval_email_sent_at: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        source: 'website',
      };
    });

    await idempotentInsert(knex, {
      table: 'applications',
      data: applications,
      conflictColumns: ['application_number'],
      logLabel: 'applications',
    });
    logSeeder('Seeded applications table');
  } catch (error) {
    handleSeederError('applications', error);
    throw error;
  }
}
