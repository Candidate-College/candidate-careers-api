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

  static readonly relationMappings = {
    /**
     * Many-to-Many: Permission → Role (via role_permissions)
     */
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
    /**
     * HasMany: Permission → RolePermission (junction table)
     *
     * Enables joinRelated traversals for permission → role_permissions → role → user_roles.
     */
    role_permissions: {
      relation: Model.HasManyRelation,
      modelClass: RolePermission,
      join: {
        from: 'permissions.id',
        to: 'role_permissions.permission_id',
      },
    },
  } as const;
}
