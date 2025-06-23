const Model = require('@/config/database/orm');

export interface EventCategoryData {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export class EventCategory extends Model {
  static softDelete = true;
  static tableName = 'event_categories';
}
