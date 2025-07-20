/**
 * User-Role Routes (v1)
 *
 * Nested under `/users/:id/roles` for managing the roles assigned to a user.
 * Requires `users.manage` permission.
 *
 * @module src/routes/v1/user-role-routes
 */

import { Router } from 'express';
import { UserRoleController } from '@/controllers/user-role-controller';
import { authorize } from '@/middlewares/authorization/authorize';

const router = Router({ mergeParams: true });

router.post('/', authorize('users.manage'), UserRoleController.bulkAssign);
router.delete('/:roleId', authorize('users.manage'), UserRoleController.revoke);

module.exports = router;
