/**
 * Role-Permission Controller
 *
 * Provides endpoints to manage permission assignments for a given role:
 * `POST /roles/:id/permissions` (bulk assign) and
 * `DELETE /roles/:id/permissions/:permId` (revoke).
 *
 * Embraces guard-clause style, strict typing, and delegates data access to
 * `RolePermissionRepository` to keep controller thin.
 *
 * @module controllers/role-permission-controller
 */

import { Request, Response } from 'express';
import { RolePermissionRepository } from '@/repositories/role-permission-repository';
import { defaultLogger as logger } from '@/config/logger';

export class RolePermissionController {
  /**
   * Bulk assign permissions to role.
   * Expects body: `{ permissionIds: number[] }`.
   */
  static async bulkAssign(req: Request, res: Response) {
    try {
      const roleId = Number(req.params.id);
      if (!Number.isInteger(roleId)) {
        return res.status(400).json({ success: false, message: 'Invalid role id' });
      }
      const { permissionIds } = req.body || {};
      if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: 'permissionIds (non-empty array) required' });
      }
      const inserted = await RolePermissionRepository.bulkAssign(roleId, permissionIds);
      return res.status(200).json({ success: true, inserted });
    } catch (err) {
      logger.error('RolePermissionController.bulkAssign', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  /** Revoke a permission from role */
  static async revoke(req: Request, res: Response) {
    try {
      const roleId = Number(req.params.id);
      const permId = Number(req.params.permId);
      if (!Number.isInteger(roleId) || !Number.isInteger(permId)) {
        return res.status(400).json({ success: false, message: 'Invalid ids' });
      }
      const deleted = await RolePermissionRepository.revoke(roleId, permId);
      if (!deleted) return res.status(404).json({ success: false, message: 'Mapping not found' });
      return res.status(204).send();
    } catch (err) {
      logger.error('RolePermissionController.revoke', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}
