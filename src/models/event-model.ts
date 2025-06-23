const Model = require('@/config/database/orm');
import { EventCategory } from './event-category-model';

export interface EventData {
  id: number;
  category_id: number;
  slug: string;
  title: string;
  description?: string;
  starts_at?: Date;
  ends_at?: Date;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export class Event extends Model {
  static softDelete = true;
  static tableName = 'events';

  static relationMappings = {
    category: {
      relation: Model.BelongsToOneRelation,
      modelClass: EventCategory,
      join: {
        from: 'events.category_id',
        to: 'event_categories.id',
      },
    },
  };
}
