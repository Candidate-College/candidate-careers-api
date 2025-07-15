/**
 * User Routes (v1)
 *
 * Currently only mount nested user-role assignment routes. Additional user CRUD
 * endpoints to be implemented in future tasks.
 *
 * @module src/routes/v1/user-routes
 */

import { Router } from 'express';

const router = Router();

// Nested routes for managing roles of a particular user
router.use('/:id/roles', require('./user-role-routes'));

module.exports = router;
