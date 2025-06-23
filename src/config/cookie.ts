/**
 * Cookie configuration
 */
module.exports = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: process.env.COOKIE_TTL || 7 * 24 * 60 * 60 * 1000,
};
