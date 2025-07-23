/**
 * Seeder for department_analytics_daily table
 *
 * Inserts at least 30 realistic, normally distributed daily analytics records for departments.
 * Some departments are much more active than others.
 *
 * @module database/seeders/202507230003_department_analytics_daily
 */

import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Assume department IDs 1-5 exist
  const deptIds = [1, 2, 3, 4, 5];
  const today = new Date();
  const analytics: any[] = [];
  // Simulate normal distribution: departments 1,2 are "hot"
  const deptBaseViews = [300, 250, 150, 80, 60];
  for (let i = 0; i < deptIds.length; i++) {
    for (let d = 0; d < 6; d++) {
      const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
      const totalJobs = Math.round(10 * (0.8 + Math.random() * 0.4));
      const totalViews = Math.round(deptBaseViews[i] * (0.8 + Math.random() * 0.4));
      const totalApplications = Math.round(totalViews * (0.06 + Math.random() * 0.08));
      const avgConversionRate =
        totalViews === 0 ? 0 : Math.round((totalApplications / totalViews) * 10000) / 100;
      analytics.push({
        department_id: deptIds[i],
        analytics_date: date.toISOString().slice(0, 10),
        total_jobs: totalJobs,
        total_views: totalViews,
        total_applications: totalApplications,
        average_conversion_rate: avgConversionRate,
        created_at: date,
        updated_at: date,
      });
    }
  }
  await knex('department_analytics_daily').del();
  await knex('department_analytics_daily').insert(analytics);
}
