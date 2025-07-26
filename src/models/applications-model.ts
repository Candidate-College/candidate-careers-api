const Model = require('@/config/database/orm');

export class Applications extends Model {
  static readonly tableName = 'applications';
}
