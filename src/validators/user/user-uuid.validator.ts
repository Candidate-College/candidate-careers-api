const { param } = require('express-validator');

module.exports = [
  param('uuid')
    .isUUID()
    .withMessage('Invalid user UUID'),
];
