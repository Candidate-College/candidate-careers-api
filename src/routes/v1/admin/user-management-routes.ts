/**
 * Admin User Management Routes (v1)
 *
 * Super Admin protected endpoints for comprehensive user management.
 * Currently only implements listing endpoint.
 *
 * @module routes/v1/admin/user-management-routes
 */

import { Router } from 'express';
import { UserManagementController } from '@/controllers/user-management-controller';

const { accessToken } = require('@/middlewares/auth-middleware');
const { requireRole } = require('@/middlewares/role-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const listUsersSchema = require('@/validators/user/list-users.validator');

const router = Router();

// Require authentication + Super Admin role for everything below
router.use(accessToken, requireRole('super_admin'));

// GET /admin/users
router.get('/', validate(listUsersSchema, { only: 'query' }), UserManagementController.listUsers);

module.exports = router;
