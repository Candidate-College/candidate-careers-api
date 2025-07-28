import { User, UserData } from './user-model';
import { Job } from './job-model';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('@/config/database/orm');

/**
 * DepartmentData
 *
 * Interface for department data representation.
 */
export interface DepartmentData {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  created_by?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  creator?: Partial<UserData>; // relasi ke user pembuat
  job_postings_count?: number | Array<{ count: number }>;
}

/**
 * Department
 *
 * Objection.js model for departments table.
 */
export class Department extends Model {
  static readonly softDelete = true;
  static readonly tableName = 'departments';

  static readonly relationMappings = {
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'departments.created_by',
        to: 'users.id',
      },
    },
    jobPostings: {
      relation: Model.HasManyRelation,
      modelClass: Job,
      join: {
        from: 'departments.id',
        to: 'job_postings.department_id',
      },
    },
  };
} 