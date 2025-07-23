/**
 * DepartmentAnalyticsDaily Model
 *
 * Represents daily aggregated analytics for a department (total jobs, views, applications, avg conversion rate).
 * Used for department-level analytics and reporting.
 *
 * @module models/department-analytics-daily-model
 */

import { Department } from './department-model';
const Model = require('@/config/database/orm');

export class DepartmentAnalyticsDaily extends Model {
  static readonly tableName = 'department_analytics_daily';
  static readonly idColumn = 'id';

  static readonly relationMappings = {
    department: {
      relation: Model.BelongsToOneRelation,
      modelClass: Department,
      join: {
        from: 'department_analytics_daily.department_id',
        to: 'departments.id',
      },
    },
  };
}
