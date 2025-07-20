import { Role, RoleData } from '@/models/role-model';
// const toResource = require('@/utilities/resource');
// const roleResource = require('@/resources/role-resource');

exports.findRoleById = async (
  id: number,
): Promise<RoleData | null> => {
  return await Role.query().findById(id);
};
