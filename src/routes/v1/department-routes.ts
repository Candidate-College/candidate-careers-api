import { Router } from 'express';
import { DepartmentController } from '@/controllers/department-controller';
import {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdParamValidator,
  listDepartmentsValidator,
} from '@/validators/department-validator';
const validate = require('@/middlewares/request-validation-middleware');
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

const router = Router();

router.use(accessToken);

// List & search departments (all authenticated users)
router.get(
  '/',
  listDepartmentsValidator,
  validate,
  DepartmentController.list
);

// Get department by ID (all authenticated users)
router.get(
  '/:id',
  departmentIdParamValidator,
  validate,
  DepartmentController.detail
);

// Create department (permission: departments.create)
router.post(
  '/',
  authorize('departments.create'),
  createDepartmentValidator,
  validate,
  DepartmentController.create
);

// Update department (permission: departments.update)
router.put(
  '/:id',
  authorize('departments.update'),
  departmentIdParamValidator,
  updateDepartmentValidator,
  validate,
  DepartmentController.update
);

// Delete department (permission: departments.delete)
router.delete(
  '/:id',
  authorize('departments.delete'),
  departmentIdParamValidator,
  validate,
  DepartmentController.delete
);

export default router; 