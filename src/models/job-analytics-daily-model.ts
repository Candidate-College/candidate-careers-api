/**
 * JobAnalyticsDaily Model
 *
 * Represents daily aggregated analytics for a job posting (views, applications, conversion rate).
 * Used for efficient analytics queries and reporting.
 *
 * @module models/job-analytics-daily-model
 */

import { Job } from './job-model';
const Model = require('@/config/database/orm');

export class JobAnalyticsDaily extends Model {
  static tableName = 'job_analytics_daily';
  static idColumn = 'id';

  static relationMappings = {
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: {
        from: 'job_analytics_daily.job_posting_id',
        to: 'job_postings.id',
      },
    },
  };
}
