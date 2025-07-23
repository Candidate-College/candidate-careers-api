/**
 * Job Scheduled Publisher
 *
 * Background job untuk memproses scheduled publishing pada job_postings.
 * Setiap 1 menit, publish otomatis semua job dengan status 'draft' dan scheduled_publish_at <= now.
 *
 * @module services/job-scheduled-publisher
 */

import cron from 'node-cron';
import { Job } from '@/models/job-model';
import { JobStatusWorkflowService } from './job-status-workflow-service';
import { defaultWinstonLogger as winston } from '@/utilities/winston-logger';

// Jalankan setiap 1 menit
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Cari semua job yang status draft dan scheduled_publish_at <= now
    const jobs = await Job.query()
      .where('status', 'draft')
      .whereNotNull('scheduled_publish_at')
      .where('scheduled_publish_at', '<=', now);
    if (jobs.length === 0) return;
    winston.info(`[ScheduledPublisher] Found ${jobs.length} jobs to publish`);
    for (const job of jobs) {
      try {
        // Publish job
        await JobStatusWorkflowService.transitionStatus(
          job.id,
          'draft',
          'published',
          {
            publish_immediately: false,
            scheduled_publish_at: job.scheduled_publish_at,
            notification_settings: {
              notify_head_of_hr: true,
              notify_team: true,
              send_confirmation: true,
            },
            validation_override: false,
          },
          job.created_by || 1, // fallback ke 1 jika tidak ada
        );
        winston.info(`[ScheduledPublisher] Published job ${job.id} (${job.uuid})`);
      } catch (err: any) {
        winston.error(`[ScheduledPublisher] Failed to publish job ${job.id}: ${err.message}`);
      }
    }
  } catch (err: any) {
    winston.error('[ScheduledPublisher] Error in scheduled publishing', { error: err.message });
  }
});
