import { UserSession, UserSessionData } from './user-session-model';
const Model = require('@/config/database/orm');

export interface UserData {
  id: number;
  name: string;
  email: string;
  password?: string;
  password_hash?: string;
  role_id?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role: string;
  verification_token?: string;
  email_verified_at?: Date | null;
  last_email_verify_requested_at?: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
  sessions?: UserSessionData[];
}

export class User extends Model {
  static readonly softDelete = true;
  static readonly tableName = 'users';

  static readonly relationMappings = {
    sessions: {
      relation: Model.HasManyRelation,
      modelClass: UserSession,
      join: {
        from: 'users.id',
        to: 'user_sessions.user_id',
      },
    },
  };
}
