const email = { type: 'email' };
const password = { type: 'string', min: 6 };

module.exports = {
  register: {
    name: { type: 'string' },
    email,
    password,
    retype_password: password,
  },

  login: { email, password },

  sendPasswordResetVerification: { email },

  resetPassword: {
    token: { type: 'text' },
    password,
    retype_pasword: password,
  },

  resendVerification: { email },
};
