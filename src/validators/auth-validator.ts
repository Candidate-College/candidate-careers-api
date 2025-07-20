import { ValidationSchema } from '@/middlewares/request-validation-middleware';
const email = { type: 'email' };
const password = { type: 'string', min: 8, complex: true };

const registerValidation: ValidationSchema = {
  name: { type: 'string', min: 2, max: 100 },
  email: { type: 'email' },
  password: { type: 'string', min: 8, complex: true },
  role_id: { type: 'integer' },
};

const verifyEmailValidation: ValidationSchema = {
  token: { type: 'text' },
  email: { type: 'email' },
};

const loginValidation: ValidationSchema = {
  email: { type: 'email' },
  password: { type: 'string', min: 8, complex: true },
};

module.exports = {
  register: registerValidation,
  verifyEmail: verifyEmailValidation,
  login: loginValidation,
  sendPasswordResetVerification: { email },
  resetPassword: {
    token: { type: 'text' },
    password,
    retype_pasword: password,
  },
  resendVerification: { email },
};
