const Model = require('@/config/database/orm');
// @ts-ignore: Department model assumed to exist
import { Department } from './department-model';
// @ts-ignore: JobCategory model assumed to exist
import { JobCategory } from './job-category-model';
import { User } from './user-model';

/**
 * JobPostingsData interface
 * Represents a row in the job_postings table.
 */
export interface JobPostingsData {
  id: number;
  uuid: string;
  title: string;
  slug?: string | null;
  department_id: number;
  job_category_id: number;
  job_type: 'internship' | 'staff' | 'freelance' | 'contract';
  employment_level: 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'head' | 'co_head';
  priority_level: 'normal' | 'urgent';
  description: string;
  requirements: string;
  responsibilities: string;
  benefits?: string | null;
  team_info?: string | null;
  salary_min?: string | null;
  salary_max?: string | null;
  is_salary_negotiable: boolean;
  location?: string | null;
  is_remote: boolean;
  application_deadline?: Date | null;
  max_applications?: number | null;
  status: 'draft' | 'published' | 'closed' | 'archived';
  views_count: number;
  applications_count: number;
  published_at?: Date | null;
  closed_at?: Date | null;
  created_by: number;
  updated_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  department?: Department;
  jobCategory?: JobCategory;
  creator?: User;
}

/**
 * JobPostings Model
 * Objection.js model for the job_postings table.
 */
export class JobPostings extends Model {
  static readonly tableName = 'job_postings';
  static readonly softDelete = true;

  static readonly relationMappings = {
    department: {
      relation: Model.BelongsToOneRelation,
      modelClass: Department,
      join: {
        from: 'job_postings.department_id',
        to: 'departments.id',
      },
    },
    jobCategory: {
      relation: Model.BelongsToOneRelation,
      modelClass: JobCategory,
      join: {
        from: 'job_postings.job_category_id',
        to: 'job_categories.id',
      },
    },
    creator: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_postings.created_by',
        to: 'users.id',
      },
    },
  } as const;
} 