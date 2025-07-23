/**
 * Seeder for job_analytics_daily table
 *
 * Inserts at least 30 realistic, normally distributed daily analytics records for jobs.
 * Some jobs are much more popular than others.
 *
 * @module database/seeders/202507230002_job_analytics_daily
 */

import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Assume job_postings IDs 1-10 exist
  const jobIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const today = new Date();
  const analytics: any[] = [];
  // Simulate normal distribution: jobs 1,2,3 are "hot"
  const jobBaseViews = [100, 90, 80, 40, 35, 30, 25, 20, 15, 10];
  for (let i = 0; i < jobIds.length; i++) {
    for (let d = 0; d < 3; d++) {
      const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
      const totalViews = Math.round(jobBaseViews[i] * (0.8 + Math.random() * 0.4));
      const uniqueViews = Math.round(totalViews * (0.7 + Math.random() * 0.2));
      const totalApplications = Math.round(totalViews * (0.05 + Math.random() * 0.1));
      const conversionRate =
        totalViews === 0 ? 0 : Math.round((totalApplications / totalViews) * 10000) / 100;
      analytics.push({
        job_posting_id: jobIds[i],
        analytics_date: date.toISOString().slice(0, 10),
        total_views: totalViews,
        unique_views: uniqueViews,
        total_applications: totalApplications,
        conversion_rate: conversionRate,
        created_at: date,
        updated_at: date,
      });
    }
  }
  await knex('job_analytics_daily').del();
  await knex('job_analytics_daily').insert(analytics);
}
