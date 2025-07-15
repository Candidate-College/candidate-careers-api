/**
 * Role Controller
 *
 * Handles HTTP requests for Role management endpoints (`/roles`). Delegates
 * data access to `RoleRepository` and enforces standard response format.
 *
 * @module controllers/role-controller
 */

import { Request, Response } from 'express';
import { RoleRepository } from '@/repositories/role-repository';
import { defaultLogger as logger } from '@/config/logger';

export class RoleController {
  /** POST /roles */
  static async create(req: Request, res: Response) {
    try {
      const { name, display_name, description } = req.body || {};
      if (!name || !display_name) {
        return res.status(400).json({ success: false, message: 'name and display_name required' });
      }
      const role = await RoleRepository.create({ name, display_name, description });
      return res.status(201).json({ success: true, data: role });
    } catch (err) {
      logger.error('RoleController.create', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  /** GET /roles */
  static async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number((req.query.page_size ?? req.query.pageSize) || 20);
      const search = req.query.search ? String(req.query.search) : undefined;
      const result = await RoleRepository.list({ page, pageSize }, search);
      return res.json({ success: true, ...result });
    } catch (err) {
      logger.error('RoleController.list', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  /** PATCH /roles/:id */
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const patch = req.body;
      const updated = await RoleRepository.update(id, patch);
      if (!updated) return res.status(404).json({ success: false, message: 'Role not found' });
      return res.json({ success: true, data: updated });
    } catch (err) {
      logger.error('RoleController.update', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }

  /** DELETE /roles/:id (soft) */
  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deleted = await RoleRepository.delete(id);
      if (!deleted) return res.status(404).json({ success: false, message: 'Role not found' });
      return res.status(204).send();
    } catch (err) {
      logger.error('RoleController.remove', { err });
      return res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
}
