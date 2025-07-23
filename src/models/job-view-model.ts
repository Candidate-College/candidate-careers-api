/**
 * JobView Model
 *
 * Represents a single view event for a job posting, including metadata for analytics.
 * Used for atomic view tracking and unique view calculation.
 *
 * @module models/job-view-model
 */

import { Job } from './job-model';
const Model = require('@/config/database/orm');

export class JobView extends Model {
  static tableName = 'job_views';
  static idColumn = 'id';

  static relationMappings = {
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: {
        from: 'job_views.job_posting_id',
        to: 'job_postings.id',
      },
    },
  };
}
