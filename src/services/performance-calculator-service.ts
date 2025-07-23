/**
 * PerformanceCalculatorService
 *
 * Provides job performance scoring, insights generation, and benchmarking against department averages.
 * Integrates with analytics repositories and Winston logger for observability and reliability.
 *
 * @module services/performance-calculator-service
 */

import { JobAnalyticsDailyRepository } from '@/repositories/job-analytics-daily-repository';
import { DepartmentAnalyticsDailyRepository } from '@/repositories/department-analytics-daily-repository';
import { defaultWinstonLogger } from '@/utilities/winston-logger';

export class PerformanceCalculatorService {
  /**
   * Calculate overall job performance score based on metrics and benchmarks.
   */
  static async calculateJobPerformance(
    jobPostingId: number,
    startDate: string,
    endDate: string,
    benchmarks: { averageViews: number; averageConversion: number; averageApplications: number },
  ) {
    try {
      const metrics = await JobAnalyticsDailyRepository.aggregateMetrics(
        jobPostingId,
        startDate,
        endDate,
      );
      const viewsScore =
        Math.min((metrics.total_views || 0) / (benchmarks.averageViews || 1), 2) * 30;
      const conversionScore =
        Math.min((metrics.avg_conversion_rate || 0) / (benchmarks.averageConversion || 1), 2) * 40;
      const applicationScore =
        Math.min((metrics.total_applications || 0) / (benchmarks.averageApplications || 1), 2) * 30;
      const score = Math.round(viewsScore + conversionScore + applicationScore);
      await defaultWinstonLogger.asyncInfo('Job performance score calculated', {
        jobPostingId,
        score,
        metrics,
        benchmarks,
      });
      return score;
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to calculate job performance score', {
        jobPostingId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate insights and recommendations based on job metrics.
   */
  static generateInsights(metrics: {
    total_views: number;
    total_applications: number;
    conversion_rate: number;
    avg_conversion_rate?: number;
  }) {
    const insights: string[] = [];
    if (metrics.conversion_rate < 2)
      insights.push('Consider improving job description or requirements.');
    if (metrics.total_views < 100) insights.push('Increase job promotion or visibility.');
    if ((metrics.avg_conversion_rate || 0) > metrics.conversion_rate)
      insights.push('Conversion rate below department average.');
    if (insights.length === 0) insights.push('Job is performing well.');
    return insights;
  }

  /**
   * Benchmark job performance against department averages.
   */
  static async benchmarkAgainstDepartment(
    jobPostingId: number,
    departmentId: number,
    startDate: string,
    endDate: string,
  ) {
    try {
      const jobMetrics = await JobAnalyticsDailyRepository.aggregateMetrics(
        jobPostingId,
        startDate,
        endDate,
      );
      const deptMetrics = await DepartmentAnalyticsDailyRepository.aggregateMetrics(
        departmentId,
        startDate,
        endDate,
      );
      await defaultWinstonLogger.asyncInfo('Job performance benchmarked against department', {
        jobPostingId,
        departmentId,
        jobMetrics,
        deptMetrics,
      });
      return {
        job: jobMetrics,
        department: deptMetrics,
        performancePercentile: deptMetrics.avg_conversion_rate
          ? Math.round((jobMetrics.avg_conversion_rate / deptMetrics.avg_conversion_rate) * 100)
          : 0,
      };
    } catch (error) {
      await defaultWinstonLogger.asyncError('Failed to benchmark job against department', {
        jobPostingId,
        departmentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
