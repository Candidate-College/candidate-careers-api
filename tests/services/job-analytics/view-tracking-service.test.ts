/**
 * ViewTrackingService Unit Tests
 *
 * Tests for atomic view tracking, unique view calculation, and view metrics.
 * Covers happy paths, edge cases, and error handling.
 *
 * @module tests/services/job-analytics/view-tracking-service.test
 */

import { ViewTrackingService } from '../../../src/services/view-tracking-service';
import { JobViewRepository } from '../../../src/repositories/job-view-repository';
import { defaultWinstonLogger } from '../../../src/utilities/winston-logger';

jest.mock('../../../src/repositories/job-view-repository');
jest.mock('../../../src/utilities/winston-logger');

describe('ViewTrackingService', () => {
  const jobPostingId = 1;
  const trackingData = {
    ip_address: '127.0.0.1',
    user_agent: 'test',
    session_id: 'abc',
    referrer: 'ref',
    viewed_at: new Date(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementViewCount', () => {
    it('should insert a view and log info', async () => {
      (JobViewRepository.insertView as jest.Mock).mockResolvedValue({ id: 123 });
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await ViewTrackingService.incrementViewCount(jobPostingId, trackingData);
      expect(JobViewRepository.insertView).toHaveBeenCalledWith({
        job_posting_id: jobPostingId,
        ...trackingData,
        viewed_at: trackingData.viewed_at,
      });
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job view incremented',
        expect.objectContaining({ jobPostingId, viewId: 123 }),
      );
      expect(result).toEqual({ id: 123 });
    });
    it('should log and throw on error', async () => {
      (JobViewRepository.insertView as jest.Mock).mockRejectedValue(new Error('fail'));
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(
        ViewTrackingService.incrementViewCount(jobPostingId, trackingData),
      ).rejects.toThrow('fail');
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to increment job view',
        expect.objectContaining({ jobPostingId }),
      );
    });
  });

  describe('getViewMetrics', () => {
    it('should return total and unique views', async () => {
      (JobViewRepository.countTotalViews as jest.Mock).mockResolvedValue(10);
      (JobViewRepository.countUniqueViews as jest.Mock).mockResolvedValue(5);
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await ViewTrackingService.getViewMetrics(jobPostingId, '2024-01-01');
      expect(result).toEqual({ totalViews: 10, uniqueViews: 5 });
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job view metrics retrieved',
        expect.objectContaining({
          jobPostingId,
          date: '2024-01-01',
          totalViews: 10,
          uniqueViews: 5,
        }),
      );
    });
    it('should log and throw on error', async () => {
      (JobViewRepository.countTotalViews as jest.Mock).mockRejectedValue(new Error('fail'));
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(ViewTrackingService.getViewMetrics(jobPostingId, '2024-01-01')).rejects.toThrow(
        'fail',
      );
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to get job view metrics',
        expect.objectContaining({ jobPostingId, date: '2024-01-01' }),
      );
    });
  });

  describe('getUniqueViews', () => {
    it('should return unique views', async () => {
      (JobViewRepository.countUniqueViews as jest.Mock).mockResolvedValue(7);
      (defaultWinstonLogger.asyncInfo as jest.Mock).mockResolvedValue(undefined);
      const result = await ViewTrackingService.getUniqueViews(jobPostingId, '2024-01-01');
      expect(result).toBe(7);
      expect(defaultWinstonLogger.asyncInfo).toHaveBeenCalledWith(
        'Job unique views calculated',
        expect.objectContaining({ jobPostingId, date: '2024-01-01', uniqueViews: 7 }),
      );
    });
    it('should log and throw on error', async () => {
      (JobViewRepository.countUniqueViews as jest.Mock).mockRejectedValue(new Error('fail'));
      (defaultWinstonLogger.asyncError as jest.Mock).mockResolvedValue(undefined);
      await expect(ViewTrackingService.getUniqueViews(jobPostingId, '2024-01-01')).rejects.toThrow(
        'fail',
      );
      expect(defaultWinstonLogger.asyncError).toHaveBeenCalledWith(
        'Failed to calculate unique job views',
        expect.objectContaining({ jobPostingId, date: '2024-01-01' }),
      );
    });
  });
});
