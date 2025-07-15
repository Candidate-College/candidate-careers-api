/**
 * Role Model
 *
 * Objection.js model mapping the `roles` table. Provides relations to
 * `permissions` through the `role_permissions` junction table.
 *
 * @module src/models/role-model
 */

const Model = require('@/config/database/orm');
import { Permission } from './permission-model';
import { RolePermission } from './role-permission-model';

export interface RoleData {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  permissions?: Permission[];
}

export class Role extends Model {
  static tableName = 'roles';
  static softDelete = true;

  static relationMappings = {
    permissions: {
      relation: Model.ManyToManyRelation,
      modelClass: Permission,
      join: {
        from: 'roles.id',
        through: {
          from: 'role_permissions.role_id',
          to: 'role_permissions.permission_id',
          modelClass: RolePermission,
        },
        to: 'permissions.id',
      },
    },
  } as const;
}
