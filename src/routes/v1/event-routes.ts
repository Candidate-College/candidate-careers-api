const router = require('express').Router();

const { accessToken } = require('@/middlewares/auth-middleware');
const validate = require('@/middlewares/request-validation-middleware');
const fields = require('@/validators/event-validator');
const eventController = require('@/controllers/event-controller');

router.get('/', validate(fields, { only: 'query' }), eventController.index);
router.get('/:slug', validate(fields, { only: 'param' }), eventController.show);

router.use(accessToken);
router.post('/', validate(fields, { only: 'body' }), eventController.store);
router.patch('/:slug', validate(fields, { without: 'query', optional: true }), eventController.update);
router.delete('/:slug', validate(fields, { only: 'param' }), eventController.destroy);

module.exports = router;
