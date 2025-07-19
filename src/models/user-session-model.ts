const Model = require('@/config/database/orm');

export interface UserSessionData {
  id: string;
  user_id: number;
  user_agent?: string;
  ip_address?: string;
  payload: string;
  last_activity?: number;
}

export class UserSession extends Model {
  static tableName = 'sessions';
}
