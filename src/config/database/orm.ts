/**
 * Initiate Object Relational Mapping
 */
const orm = require('objection');
const softDelete = require('objection-softdelete');

orm.Model.knex(require('./query-builder'));
softDelete.register(orm, { deleteAttr: 'deleted_at' });

module.exports = orm.Model;
