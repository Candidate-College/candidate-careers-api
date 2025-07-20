import { ValidationSchema } from '@/middlewares/request-validation-middleware';

const profileValidation: ValidationSchema = {
  name: { type: 'string', min: 2, max: 100, optional: true },
  current_password: { type: 'string', min: 8, complex: true },
  new_password: { type: 'string', min: 8, complex: true, optional: true },
};

module.exports = {
  profile: profileValidation,
};
