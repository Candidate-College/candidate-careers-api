/**
 * JobStatusTransition Model
 *
 * Represents a single status transition for a job posting, including audit trail and metadata.
 *
 * @module models/job-status-transition-model
 */
const Model = require('@/config/database/orm');

import { Job } from './job-model';
import { User } from './user-model';

export class JobStatusTransition extends Model {
  static tableName = 'job_status_transitions';

  static relationMappings = {
    job: {
      relation: Model.BelongsToOneRelation,
      modelClass: Job,
      join: { from: 'job_status_transitions.job_posting_id', to: 'job_postings.id' },
    },
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: { from: 'job_status_transitions.created_by', to: 'users.id' },
    },
  };
}
