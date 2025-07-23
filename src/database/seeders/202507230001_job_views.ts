/**
 * Seeder for job_views table
 *
 * Inserts at least 30 realistic, normally distributed job view records.
 * Some jobs are much more popular than others.
 *
 * @module database/seeders/202507230001_job_views
 */

import type { Knex } from 'knex';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (Linux; Android 10)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X)',
];
const referrers = [
  'https://www.google.com/',
  'https://www.linkedin.com/',
  'https://www.facebook.com/',
  'https://jobs.example.com/',
  '',
];
const ipBase = '192.168.1.';

export async function seed(knex: Knex): Promise<void> {
  // Assume job_postings IDs 1-10 exist
  const jobIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const views: any[] = [];
  // Simulate normal distribution: jobs 1,2,3 are "hot"
  const jobViewCounts = [20, 18, 15, 8, 7, 6, 5, 4, 3, 2];
  let viewId = 1;
  for (let i = 0; i < jobIds.length; i++) {
    for (let j = 0; j < jobViewCounts[i]; j++) {
      const ip = ipBase + ((viewId % 50) + 1);
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      const sessionId = `sess_${Math.floor(Math.random() * 10000)}`;
      const viewedAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
      views.push({
        job_posting_id: jobIds[i],
        ip_address: ip,
        user_agent: userAgent,
        referrer,
        session_id: sessionId,
        viewed_at: viewedAt,
      });
      viewId++;
    }
  }
  await knex('job_views').del();
  await knex('job_views').insert(views);
}
