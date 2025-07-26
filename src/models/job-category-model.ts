import { User, UserData } from './user-model';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('@/config/database/orm');

/**
 * JobCategoryData
 * Interface untuk representasi data job category.
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
}

/**
 * JobCategory
 * Model Objection.js untuk tabel job_categories.
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
      modelClass: require('./job-posting-model'),
      join: {
        from: 'job_categories.id',
        to: 'job_postings.job_category_id',
      },
    },
  };
}
