import { Knex } from 'knex';
import { Role, RoleData } from '../../models/role-model';
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
  // Deletes ALL existing entries
  await knex('users').del();

  // Inserts seed entries
  await knex('users').insert([
    {
      name: 'Superadmin',
      email: 'superadmin@careers.candidatecollege.org',
      password: await crypto.hash('Password123!'),
      role_id: await getRoleId(knex, 'superadmin'),
    },
    {
      name: 'Recruiter John Doe',
      email: 'recruiter1@careers.candidatecollege.org',
      password: await crypto.hash('Password123!'),
      role_id: await getRoleId(knex, 'hrstaff'),
    },
    {
      name: 'Head of HR',
      email: 'headhr@careers.candidatecollege.org',
      password: await crypto.hash('Password123!'),
      role_id: await getRoleId(knex, 'headhr'),
    },
  ]);
}
