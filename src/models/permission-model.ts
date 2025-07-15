/**
 * Permission Model
 *
 * Represents records in the `permissions` table and defines Many-to-Many
 * relations to `roles` via the junction `role_permissions` table.
 *
 * @module src/models/permission-model
 */

import { Role } from './role-model';
import { RolePermission } from './role-permission-model';
const Model = require('@/config/database/orm');

export interface PermissionData {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  roles?: Role[];
}

export class Permission extends Model {
  static tableName = 'permissions';
  static softDelete = true;

  static relationMappings = {
    roles: {
      relation: Model.ManyToManyRelation,
      modelClass: Role,
      join: {
        from: 'permissions.id',
        through: {
          from: 'role_permissions.permission_id',
          to: 'role_permissions.role_id',
          modelClass: RolePermission,
        },
        to: 'roles.id',
      },
    },
  } as const;
}
