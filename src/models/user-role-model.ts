/**
 * UserRoleModel
 *
 * Objection.js model representing the `user_roles` junction table that links
 * users with roles. Soft-delete is disabled because we rely on hard deletes for
 * revocations (business logic enforces constraints).
 *
 * @module src/models/user-role-model
 */

import { Role } from './role-model';
import { User } from './user-model';
// Base ORM model is CommonJS exported from the central ORM factory.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Model = require('@/config/database/orm');

export interface UserRoleData {
  id: number;
  user_id: number;
  role_id: number;
  created_at: Date;
  updated_at: Date;
}

export class UserRole extends Model {
  static tableName = 'user_roles';
  static softDelete = false;

  static relationMappings = {
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'user_roles.user_id',
        to: 'users.id',
      },
    },
    role: {
      relation: Model.BelongsToOneRelation,
      modelClass: Role,
      join: {
        from: 'user_roles.role_id',
        to: 'roles.id',
      },
    },
  };
}
