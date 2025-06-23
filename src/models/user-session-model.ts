const Model = require('@/config/database/orm');

export interface UserSessionData {
  id: string;
  user_id: number;
  user_agent?: string;
  ip_address?: string;
  created_at: Date;
  is_active: boolean;
  replaced_by?: string;
}

export class UserSession extends Model {
  static tableName = 'user_sessions';
}
