/**
 * AnalyticsAggregationService Unit Tests
 *
 * Tests for time-based aggregation, department summaries, and platform KPIs.
 * Covers happy paths, edge cases, and error handling.
 *
 * @module tests/services/job-analytics/analytics-aggregation-service.test
 */

import { AnalyticsAggregationService } from '../../../src/services/analytics-aggregation-service';
import { JobAnalyticsDailyRepository } from '../../../src/repositories/job-analytics-daily-repository';
import { DepartmentAnalyticsDailyRepository } from '../../../src/repositories/department-analytics-daily-repository';
import { defaultWinstonLogger } from '../../../src/utilities/winston-logger';

jest.mock('../../../src/repositories/job-analytics-daily-repository');
jest.mock('../../../src/repositories/department-analytics-daily-repository');
jest.mock('../../../src/utilities/winston-logger');

describe('AnalyticsAggregationService', () => {
  const jobPostingId = 1;
  const departmentId = 2;
  const startDate = '2024-01-01';
  const endDate = '2024-01-31';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregateByTimePeriod', () => {
    it('should return analytics array', async () => {
      (JobAnalyticsDailyRepository.getAnalyticsByJobAndRange as jest.Mock).mockResolvedValue([
        { analytics_date: '2024-01-01' },
      ]);
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await AnalyticsAggregationService.aggregateByTimePeriod(
        jobPostingId,
        startDate,
        endDate,
        'day',
      );
      expect(result).toEqual([{ analytics_date: '2024-01-01' }]);
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job analytics aggregated by time period',
        expect.objectContaining({ jobPostingId, startDate, endDate, granularity: 'day', count: 1 }),
      );
    });
    it('should log and throw on error', async () => {
      (JobAnalyticsDailyRepository.getAnalyticsByJobAndRange as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        AnalyticsAggregationService.aggregateByTimePeriod(jobPostingId, startDate, endDate, 'day'),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to aggregate job analytics by time period',
        expect.objectContaining({ jobPostingId, startDate, endDate, granularity: 'day' }),
      );
    });
  });

  describe('generateDepartmentSummary', () => {
    it('should return department summary', async () => {
      (DepartmentAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockResolvedValue({
        total_jobs: 5,
      });
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await AnalyticsAggregationService.generateDepartmentSummary(
        departmentId,
        startDate,
        endDate,
      );
      expect(result).toEqual({ total_jobs: 5 });
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Department analytics summary generated',
        expect.objectContaining({ departmentId, startDate, endDate }),
      );
    });
    it('should log and throw on error', async () => {
      (DepartmentAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        AnalyticsAggregationService.generateDepartmentSummary(departmentId, startDate, endDate),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to generate department analytics summary',
        expect.objectContaining({ departmentId, startDate, endDate }),
      );
    });
  });

  describe('calculatePlatformKPIs', () => {
    it('should return an object (placeholder)', async () => {
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await AnalyticsAggregationService.calculatePlatformKPIs(startDate, endDate);
      expect(result).toEqual({});
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Platform KPIs calculation started',
        expect.objectContaining({ startDate, endDate }),
      );
    });
    it('should log and throw on error', async () => {
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockImplementationOnce(() => {
        throw new Error('fail');
      });
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        AnalyticsAggregationService.calculatePlatformKPIs(startDate, endDate),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalled();
    });
  });
});
