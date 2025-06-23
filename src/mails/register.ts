const verifyUrl = process.env.WEB_VERIFICATOR_URL
                  || 'http://localhost:5000/api/v1/auth/verify?token=';

module.exports = (token: string) => {
  return `
    Please verify your registration using the this <a href="${verifyUrl}${token}">link</a>.
  `;
};
