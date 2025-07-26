import { Router } from 'express';
import { JobCategoryController } from '@/controllers/job-category-controller';
import {
  createJobCategoryValidator,
  updateJobCategoryValidator,
  jobCategoryIdParamValidator,
  listJobCategoriesValidator,
} from '@/validators/job-category-validator';
const validate = require('@/middlewares/request-validation-middleware');
const { authorize } = require('@/middlewares/authorization/authorize');
const { accessToken } = require('@/middlewares/auth-middleware');

const router = Router();

router.use(accessToken);

// List & search job categories (all authenticated users)
router.get(
  '/',
  listJobCategoriesValidator,
  validate,
  JobCategoryController.list
);

// Get job category by ID (all authenticated users)
router.get(
  '/:id',
  jobCategoryIdParamValidator,
  validate,
  JobCategoryController.detail
);

// Create job category (permission: job_categories.create)
router.post(
  '/',
  authorize('job_categories.create'),
  createJobCategoryValidator,
  validate,
  JobCategoryController.create
);

// Update job category (permission: job_categories.update)
router.put(
  '/:id',
  authorize('job_categories.update'),
  jobCategoryIdParamValidator,
  updateJobCategoryValidator,
  validate,
  JobCategoryController.update
);

// Delete job category (permission: job_categories.delete)
router.delete(
  '/:id',
  authorize('job_categories.delete'),
  jobCategoryIdParamValidator,
  validate,
  JobCategoryController.delete
);

export default router; 