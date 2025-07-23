/**
 * PerformanceCalculatorService Unit Tests
 *
 * Tests for job performance scoring, insights generation, and benchmarking.
 * Covers happy paths, edge cases, and error handling.
 *
 * @module tests/services/job-analytics/performance-calculator-service.test
 */

import { PerformanceCalculatorService } from '../../../src/services/performance-calculator-service';
import { JobAnalyticsDailyRepository } from '../../../src/repositories/job-analytics-daily-repository';
import { DepartmentAnalyticsDailyRepository } from '../../../src/repositories/department-analytics-daily-repository';
import { defaultWinstonLogger } from '../../../src/utilities/winston-logger';

jest.mock('../../../src/repositories/job-analytics-daily-repository');
jest.mock('../../../src/repositories/department-analytics-daily-repository');
jest.mock('../../../src/utilities/winston-logger');

describe('PerformanceCalculatorService', () => {
  const jobPostingId = 1;
  const departmentId = 2;
  const startDate = '2024-01-01';
  const endDate = '2024-01-31';
  const benchmarks = { averageViews: 50, averageConversion: 5, averageApplications: 10 };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateJobPerformance', () => {
    it('should calculate performance score', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockResolvedValue({
        total_views: 100,
        avg_conversion_rate: 10,
        total_applications: 20,
      });
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const score = await PerformanceCalculatorService.calculateJobPerformance(
        jobPostingId,
        startDate,
        endDate,
        benchmarks,
      );
      expect(typeof score).toBe('number');
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job performance score calculated',
        expect.objectContaining({ jobPostingId, score: expect.any(Number) }),
      );
    });
    it('should log and throw on error', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        PerformanceCalculatorService.calculateJobPerformance(
          jobPostingId,
          startDate,
          endDate,
          benchmarks,
        ),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to calculate job performance score',
        expect.objectContaining({ jobPostingId }),
      );
    });
  });

  describe('generateInsights', () => {
    it('should generate improvement insights', () => {
      const metrics = {
        total_views: 50,
        total_applications: 1,
        conversion_rate: 1,
        avg_conversion_rate: 5,
      };
      const insights = PerformanceCalculatorService.generateInsights(metrics);
      expect(insights).toContain('Consider improving job description or requirements.');
      expect(insights).toContain('Increase job promotion or visibility.');
      expect(insights).toContain('Conversion rate below department average.');
    });
    it('should return positive insight if job is performing well', () => {
      const metrics = {
        total_views: 200,
        total_applications: 10,
        conversion_rate: 10,
        avg_conversion_rate: 5,
      };
      const insights = PerformanceCalculatorService.generateInsights(metrics);
      expect(insights).toContain('Job is performing well.');
    });
  });

  describe('benchmarkAgainstDepartment', () => {
    it('should return job and department metrics and percentile', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockResolvedValue({
        avg_conversion_rate: 10,
      });
      (DepartmentAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockResolvedValue({
        avg_conversion_rate: 5,
      });
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await PerformanceCalculatorService.benchmarkAgainstDepartment(
        jobPostingId,
        departmentId,
        startDate,
        endDate,
      );
      expect(result).toHaveProperty('job');
      expect(result).toHaveProperty('department');
      expect(result).toHaveProperty('performancePercentile');
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job performance benchmarked against department',
        expect.objectContaining({ jobPostingId, departmentId }),
      );
    });
    it('should log and throw on error', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        PerformanceCalculatorService.benchmarkAgainstDepartment(
          jobPostingId,
          departmentId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to benchmark job against department',
        expect.objectContaining({ jobPostingId, departmentId }),
      );
    });
  });
});
