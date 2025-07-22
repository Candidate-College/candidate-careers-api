/**
 * Users Seeder
 *
 * Seeds the users table with at least 15 users for development, testing, and demo environments.
 * Ensures idempotency and referential integrity. Uses Knex for role_id lookup.
 *
 * @module src/database/seeders/20250721230502_users
 */

import { Knex } from 'knex';
const crypto = require('../../utilities/crypto');

// Get role id by name using Knex
const getRoleId = async (knex: Knex, name: string): Promise<number> => {
  const role = await knex('roles').where({ name }).first();
  if (role) return role.id;
  // fallback: get any role
  const anyRole = await knex('roles').first();
  return anyRole ? anyRole.id : 1;
};

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();

  const roles = [
    { name: 'superadmin', count: 2 },
    { name: 'headhr', count: 3 },
    { name: 'hrstaff', count: 10 },
  ];
  let users: any[] = [];
  let userIndex = 1;
  for (const role of roles) {
    const roleId = await getRoleId(knex, role.name);
    for (let i = 0; i < role.count; i++) {
      users.push({
        name: `${role.name.charAt(0).toUpperCase() + role.name.slice(1)} User ${i + 1}`,
        email: `${role.name}${i + 1}@careers.candidatecollege.org`,
        password: await crypto.hash('Password123!'),
        role_id: roleId,
      });
      userIndex++;
    }
  }
  await knex('users').insert(users);
}
