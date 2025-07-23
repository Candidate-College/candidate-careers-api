/**
 * ApplicationMetricsService Unit Tests
 *
 * Tests for application statistics, conversion rate calculation, and trends.
 * Covers happy paths, edge cases, and error handling.
 *
 * @module tests/services/job-analytics/application-metrics-service.test
 */

import { ApplicationMetricsService } from '../../../src/services/application-metrics-service';
import { JobAnalyticsDailyRepository } from '../../../src/repositories/job-analytics-daily-repository';
import { defaultWinstonLogger } from '../../../src/utilities/winston-logger';

jest.mock('../../../src/repositories/job-analytics-daily-repository');
jest.mock('../../../src/utilities/winston-logger');

describe('ApplicationMetricsService', () => {
  const jobPostingId = 1;
  const startDate = '2024-01-01';
  const endDate = '2024-01-31';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getApplicationStats', () => {
    it('should return aggregated analytics', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockResolvedValue({
        total_views: 100,
        total_applications: 10,
      });
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await ApplicationMetricsService.getApplicationStats(
        jobPostingId,
        startDate,
        endDate,
      );
      expect(result).toEqual({ total_views: 100, total_applications: 10 });
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job application stats retrieved',
        expect.objectContaining({ jobPostingId, startDate, endDate }),
      );
    });
    it('should log and throw on error', async () => {
      (JobAnalyticsDailyRepository.aggregateMetrics as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        ApplicationMetricsService.getApplicationStats(jobPostingId, startDate, endDate),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to get job application stats',
        expect.objectContaining({ jobPostingId, startDate, endDate }),
      );
    });
  });

  describe('calculateConversionRate', () => {
    it('should return 0 if views is 0', () => {
      expect(ApplicationMetricsService.calculateConversionRate(0, 10)).toBe(0);
    });
    it('should return 0 if views is undefined', () => {
      expect(ApplicationMetricsService.calculateConversionRate(undefined as any, 10)).toBe(0);
    });
    it('should calculate conversion rate to 2 decimal places', () => {
      expect(ApplicationMetricsService.calculateConversionRate(100, 7)).toBe(7);
      expect(ApplicationMetricsService.calculateConversionRate(100, 3)).toBe(3);
      expect(ApplicationMetricsService.calculateConversionRate(50, 2)).toBe(4);
    });
  });

  describe('getApplicationTrends', () => {
    it('should return trends array', async () => {
      (JobAnalyticsDailyRepository.getAnalyticsByJobAndRange as jest.Mock).mockResolvedValue([
        {
          analytics_date: '2024-01-01',
          total_applications: 2,
          conversion_rate: 5,
          total_views: 40,
        },
        {
          analytics_date: '2024-01-02',
          total_applications: 1,
          conversion_rate: 2,
          total_views: 30,
        },
      ]);
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await ApplicationMetricsService.getApplicationTrends(
        jobPostingId,
        startDate,
        endDate,
      );
      expect(result).toEqual([
        { date: '2024-01-01', applications: 2, conversion_rate: 5, views: 40 },
        { date: '2024-01-02', applications: 1, conversion_rate: 2, views: 30 },
      ]);
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job application trends retrieved',
        expect.objectContaining({ jobPostingId, startDate, endDate }),
      );
    });
    it('should log and throw on error', async () => {
      (JobAnalyticsDailyRepository.getAnalyticsByJobAndRange as jest.Mock).mockRejectedValue(
        new Error('fail'),
      );
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        ApplicationMetricsService.getApplicationTrends(jobPostingId, startDate, endDate),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to get job application trends',
        expect.objectContaining({ jobPostingId, startDate, endDate }),
      );
    });
  });
});
