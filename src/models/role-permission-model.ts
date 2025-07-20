/**
 * RolePermission Model (junction table)
 *
 * Provides mapping between `roles` and `permissions`.
 * Mostly used internally by Objection.js relation definitions; rarely queried
 * directly, but exposing a model keeps things flexible for audit/reporting.
 *
 * @module src/models/role-permission-model
 */

const Model = require('@/config/database/orm');

export interface RolePermissionData {
  id: number;
  role_id: number;
  permission_id: number;
  created_at: Date;
  updated_at: Date;
}

export class RolePermission extends Model {
  static tableName = 'role_permissions';
  static idColumn = 'id';
  static softDelete = false;
}
