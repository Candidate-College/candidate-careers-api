/**
 * Department Model
 *
 * Represents a department entity with analytics relationship for daily department analytics aggregation.
 *
 * @module models/department-model
 */

import { DepartmentAnalyticsDaily } from './department-analytics-daily-model';
const Model = require('@/config/database/orm');

export class Department extends Model {
  static tableName = 'departments';

  static relationMappings = {
    departmentAnalyticsDaily: {
      relation: Model.HasManyRelation,
      modelClass: DepartmentAnalyticsDaily,
      join: { from: 'departments.id', to: 'department_analytics_daily.department_id' },
    },
  };
}
