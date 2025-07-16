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
const createUserValidator = require('@/validators/user/create-user.validator');

// Require authentication + Super Admin role for everything below
router.use(accessToken, requireRole('super_admin'));

// POST /admin/users
router.post('/', validate(createUserValidator), UserManagementController.createUser);

// GET /admin/users
router.get('/', validate(listUsersSchema, { only: 'query' }), UserManagementController.listUsers);

// User detail
const uuidSchema = require('@/validators/user/user-uuid.validator');
router.get(
  '/:uuid',
  validate(uuidSchema, { only: 'params' }),
  UserManagementController.getUserDetail,
);

// User activity
router.get(
  '/:uuid/activity',
  validate(uuidSchema, { only: 'params' }),
  UserManagementController.getUserActivity,
);

// Update user
const updateUserValidator = require('@/validators/user/update-user.validator');
router.put(
  '/:uuid',
  validate(uuidSchema, { only: 'params' }),
  validate(updateUserValidator),
  UserManagementController.updateUser,
);

// Delete user
const deleteUserValidator = require('@/validators/user/delete-user.validator');
router.delete(
  '/:uuid',
  validate(uuidSchema, { only: 'params' }),
  validate(deleteUserValidator),
  UserManagementController.deleteUser,
);

// Reset password
const resetPasswordValidator = require('@/validators/user/reset-password.validator');
router.post(
  '/:uuid/reset-password',
  validate(uuidSchema, { only: 'params' }),
  validate(resetPasswordValidator),
  UserManagementController.resetUserPassword,
);

// User impersonation
const impersonateUserValidator = require('@/validators/user/impersonate-user.validator');
router.post(
  '/:uuid/impersonate',
  validate(uuidSchema, { only: 'params' }),
  validate(impersonateUserValidator),
  UserManagementController.impersonateUser,
);

// Bulk operations
const bulkOperationsValidator = require('@/validators/user/bulk-operations.validator');
router.post(
  '/bulk',
  validate(bulkOperationsValidator),
  UserManagementController.bulkUserOperations,
);

// User search
const searchUsersValidator = require('@/validators/user/search-users.validator');
router.get(
  '/search',
  validate(searchUsersValidator, { only: 'query' }),
  UserManagementController.searchUsers,
);

// Search suggestions
router.get('/search/suggestions', UserManagementController.getSearchSuggestions);

// User statistics
router.get('/statistics', UserManagementController.getUserStatistics);

module.exports = router;
