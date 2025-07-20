/**
 * Role Routes (v1)
 *
 * Exposes CRUD HTTP endpoints for Role management. All routes are protected by
 * authorization middleware using granular permissions. Controller logic lives
 * in `RoleController` to keep routing thin.
 *
 * @module routes/v1/role-routes
 */

import { Router } from 'express';
import { RoleController } from '@/controllers/role-controller';
import { authorize } from '@/middlewares/authorization/authorize';

const router = Router();
// Nested permissions routes
router.use('/:id/permissions', require('./role-permission-routes'));

// List roles (view permission)
router.get('/', authorize('roles.view'), RoleController.list);

// Create role (manage permission)
router.post('/', authorize('roles.manage'), RoleController.create);

// Update role
router.patch('/:id', authorize('roles.manage'), RoleController.update);

// Soft delete role
router.delete('/:id', authorize('roles.manage'), RoleController.remove);

module.exports = router;
