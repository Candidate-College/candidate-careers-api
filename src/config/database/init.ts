/**
 * Database configuration
 */
require('dotenv').config({
  path: `${__dirname}/../../../.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`,
});

import type { Knex } from 'knex';

const config: Knex.Config = {
  client: process.env.DATABASE_DRIVER || 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: process.env.DATABASE_SCHEMA?.split(',') || ['public'],
  migrations: {
    directory: __dirname + '/../../database/migrations',
  },
  seeds: {
    directory: __dirname + '/../../database/seeders',
  },
  // useNullAsDefault: true,
};

module.exports = config;
