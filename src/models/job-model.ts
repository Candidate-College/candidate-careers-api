/**
 * Job Model
 *
 * Represents a job posting with relationships to department, category, user, status transitions, and analytics.
 * Now includes analytics relationships for job views and daily analytics aggregation.
 *
 * @module models/job-model
 */

import { Department } from './department-model';
import { JobCategory } from './job-category-model';
import { User } from './user-model';
import { JobStatusTransition } from './job-status-transition-model';
import { JobView } from './job-view-model';
import { JobAnalyticsDaily } from './job-analytics-daily-model';

const Model = require('@/config/database/orm');

export class Job extends Model {
  static softDelete = true;
  static tableName = 'job_postings';

  static relationMappings = {
    departments: {
      relation: Model.BelongsToOneRelation,
      modelClass: Department,
      join: {
        from: 'job_postings.department_id',
        to: 'departments.id',
      },
    },
    job_categories: {
      relation: Model.BelongsToOneRelation,
      modelClass: JobCategory,
      join: {
        from: 'job_postings.job_category_id',
        to: 'job_categories.id',
      },
    },
    createdBy: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_postings.created_by',
        to: 'users.id',
      },
    },
    updatedBy: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_postings.updated_by',
        to: 'users.id',
      },
    },
    statusTransitions: {
      relation: Model.HasManyRelation,
      modelClass: JobStatusTransition,
      join: { from: 'job_postings.id', to: 'job_status_transitions.job_posting_id' },
    },
    jobViews: {
      relation: Model.HasManyRelation,
      modelClass: JobView,
      join: { from: 'job_postings.id', to: 'job_views.job_posting_id' },
    },
    jobAnalyticsDaily: {
      relation: Model.HasManyRelation,
      modelClass: JobAnalyticsDaily,
      join: { from: 'job_postings.id', to: 'job_analytics_daily.job_posting_id' },
    },
  };
}
