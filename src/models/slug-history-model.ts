const Model = require('@/config/database/orm');

export interface SlugHistoryData {
  id: number;
  job_posting_id: number;
  old_slug: string | null;
  new_slug: string;
  change_reason: 'creation' | 'title_update' | 'manual_update' | 'conflict_resolution';
  created_by?: number | null;
  created_at: Date;
}

export class SlugHistory extends Model {
  static readonly tableName = 'job_slug_history';

  static readonly relationMappings = {
    jobPosting: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('./job-postings-model').JobPostings,
      join: {
        from: 'job_slug_history.job_posting_id',
        to: 'job_postings.id',
      },
    },
    createdByUser: {
      relation: Model.BelongsToOneRelation,
      modelClass: require('./user-model').User,
      join: {
        from: 'job_slug_history.created_by',
        to: 'users.id',
      },
    },
  } as const;
}