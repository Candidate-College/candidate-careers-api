/**
 * DepartmentAnalyticsDailyRepository
 *
 * Repository for daily department analytics aggregation and retrieval.
 * Provides methods for upserting analytics, querying by department/date, and aggregating metrics.
 *
 * @module repositories/department-analytics-daily-repository
 */

import { DepartmentAnalyticsDaily } from '@/models/department-analytics-daily-model';

export class DepartmentAnalyticsDailyRepository {
  static async upsertDailyAnalytics(
    departmentId: number,
    analyticsDate: string,
    data: Partial<DepartmentAnalyticsDaily>,
  ): Promise<DepartmentAnalyticsDaily> {
    const existing = await DepartmentAnalyticsDaily.query().findOne({
      department_id: departmentId,
      analytics_date: analyticsDate,
    });
    if (existing) {
      return await existing.$query().patchAndFetch(data);
    }
    return await DepartmentAnalyticsDaily.query().insert({
      department_id: departmentId,
      analytics_date: analyticsDate,
      ...data,
    });
  }

  static async getAnalyticsByDepartmentAndRange(
    departmentId: number,
    startDate: string,
    endDate: string,
  ): Promise<DepartmentAnalyticsDaily[]> {
    return await DepartmentAnalyticsDaily.query()
      .where('department_id', departmentId)
      .where('analytics_date', '>=', startDate)
      .where('analytics_date', '<=', endDate)
      .orderBy('analytics_date', 'asc');
  }

  static async aggregateMetrics(
    departmentId: number,
    startDate: string,
    endDate: string,
  ): Promise<any> {
    return await DepartmentAnalyticsDaily.query()
      .where('department_id', departmentId)
      .where('analytics_date', '>=', startDate)
      .where('analytics_date', '<=', endDate)
      .sum('total_jobs as total_jobs')
      .sum('total_views as total_views')
      .sum('total_applications as total_applications')
      .avg('average_conversion_rate as avg_conversion_rate')
      .first();
  }
}
