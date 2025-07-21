import { Knex } from 'knex';
import { Role, RoleData } from '../../models/role-model';
const crypto = require('../../utilities/crypto');

// Get role id by name. Defaults to 'guest', if not: id of 1
const getRoleId = async (name: string): Promise<number> => {
  const role: RoleData =
    (await Role.query().findOne({ name })) || (await Role.query().findOne({ name: 'guest' }));
  return role?.id ?? 1;
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
      role_id: await getRoleId('superadmin'),
    },
    {
      name: 'Recruiter John Doe',
      email: 'recruiter1@careers.candidatecollege.org',
      password: await crypto.hash('Password123!'),
      role_id: await getRoleId('recruiter'),
    },
  ]);
}
