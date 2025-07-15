/**
 * User-Role Controller
 *
 * Endpoints to manage role assignments for a specific user:
 *  - POST /users/:id/roles (bulk assign)
 *  - DELETE /users/:id/roles/:roleId (revoke)
 *
 * @module src/controllers/user-role-controller
 */

import { Request, Response } from 'express';
import { UserRoleRepository } from '@/repositories/user-role-repository';
import { defaultLogger as logger } from '@/config/logger';

export class UserRoleController {
  /** Bulk assign roles to user */
  static async bulkAssign(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      if (!Number.isInteger(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid user id' });
      }
      const { roleIds } = req.body || {};
      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({ success: false, message: 'roleIds array required' });
      }
      const inserted = await UserRoleRepository.bulkAssign(userId, roleIds);
      return res.status(200).json({ success: true, inserted });
    } catch (err) {
      logger.error('UserRoleController.bulkAssign', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  /** Revoke role from user */
  static async revoke(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      const roleId = Number(req.params.roleId);
      if (!Number.isInteger(userId) || !Number.isInteger(roleId)) {
        return res.status(400).json({ success: false, message: 'Invalid ids' });
      }
      const deleted = await UserRoleRepository.revoke(userId, roleId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Mapping not found' });
      return res.status(204).send();
    } catch (err) {
      logger.error('UserRoleController.revoke', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}
