const Model = require('@/config/database/orm');

export interface RoleData {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  permissions?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class Role extends Model {
  static tableName = 'roles';
}
