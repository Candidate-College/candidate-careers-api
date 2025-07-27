import { User, UserData } from './user-model';
import { Job } from './job-model';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('@/config/database/orm');

/**
 * JobCategoryData
 * Interface for job category data representation.
 */
export interface JobCategoryData {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  color_code: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  creator?: Partial<UserData>;
  job_postings_count?: number | Array<{ count: number }>;
}

/**
 * JobCategory
 * Objection.js model for job_categories table.
 */
export class JobCategory extends Model {
  static readonly softDelete = true;
  static readonly tableName = 'job_categories';

  static readonly relationMappings = {
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_categories.created_by',
        to: 'users.id',
      },
    },
    jobPostings: {
      relation: Model.HasManyRelation,
      modelClass: Job,
      join: {
        from: 'job_categories.id',
        to: 'job_postings.job_category_id',
      },
    },
  };
}
