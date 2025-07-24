/**
 * @file Defines the Job model for job postings, including ORM mappings and relations.
 * @module models/job-model
 */
import { Department } from './department-model';
import { JobCategory } from './job-category-model';
import { User } from './user-model';
import { JobStatusTransition } from './job-status-transition-model';

const Model = require('@/config/database/orm');

/**
 * Job model representing a job posting in the system.
 * Extends the base ORM Model and defines relations to departments, job categories, users, and status transitions.
 *
 * @extends Model
 */
export class Job extends Model {
  /**
   * Enables soft deletion for job postings.
   * When true, records are not physically deleted from the database but marked as deleted.
   * @type {boolean}
   */
  static softDelete = true;

  /**
   * The table name in the database for job postings.
   * @type {string}
   */
  static tableName = 'job_postings';

  /**
   * Defines ORM relation mappings for the Job model.
   * @type {Object}
   * @property {Object} departments - BelongsToOneRelation to Department model.
   * @property {Object} job_categories - BelongsToOneRelation to JobCategory model.
   * @property {Object} createdBy - BelongsToOneRelation to User model (creator).
   * @property {Object} updatedBy - BelongsToOneRelation to User model (last updater).
   * @property {Object} statusTransitions - HasManyRelation to JobStatusTransition model.
   */
  static relationMappings = {
    /**
     * Relation to the Department this job belongs to.
     */
    departments: {
      relation: Model.BelongsToOneRelation,
      modelClass: Department,
      join: {
        from: 'job_postings.department_id',
        to: 'departments.id',
      },
    },
    /**
     * Relation to the JobCategory this job belongs to.
     */
    job_categories: {
      relation: Model.BelongsToOneRelation,
      modelClass: JobCategory,
      join: {
        from: 'job_postings.job_category_id',
        to: 'job_categories.id',
      },
    },
    /**
     * Relation to the User who created this job posting.
     */
    createdBy: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_postings.created_by',
        to: 'users.id',
      },
    },
    /**
     * Relation to the User who last updated this job posting.
     */
    updatedBy: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'job_postings.updated_by',
        to: 'users.id',
      },
    },
    /**
     * Relation to the status transitions for this job posting.
     */
    statusTransitions: {
      relation: Model.HasManyRelation,
      modelClass: JobStatusTransition,
      join: { from: 'job_postings.id', to: 'job_status_transitions.job_posting_id' },
    },
  };
}
