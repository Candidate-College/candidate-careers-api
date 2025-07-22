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
// Move import after Model require to avoid circular dependency issues
import { Role } from './role-model';

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

  static get relationMappings() {
    // Fallback to require if Role is undefined (runtime circular dep workaround)
    const RoleModel = Role || require('./role-model').Role;
    return {
      /**
       * BelongsToOne: RolePermission → Role
       *
       * Enables joinRelated traversals for role_permissions → role → user_roles.
       */
      role: {
        relation: Model.BelongsToOneRelation,
        modelClass: RoleModel,
        join: {
          from: 'role_permissions.role_id',
          to: 'roles.id',
        },
      },
    };
  }
}
