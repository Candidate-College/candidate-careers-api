/**
 * Role-Permission Routes (v1)
 *
 * Nested under `/roles/:id/permissions` for managing permission assignments
 * on a specific role. Requires `roles.manage` permission.
 *
 * @module routes/v1/role-permission-routes
 */

import { Router } from 'express';
import { RolePermissionController } from '@/controllers/role-permission-controller';
import { authorize } from '@/middlewares/authorization/authorize';

const router = Router({ mergeParams: true });

router.post('/', authorize('roles.manage'), RolePermissionController.bulkAssign);
router.delete('/:permId', authorize('roles.manage'), RolePermissionController.revoke);

module.exports = router;
