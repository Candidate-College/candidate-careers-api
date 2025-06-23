/**
 * JSON Web Token configuration
 */
module.exports = {
  /**
   * Used in authentication to access resources within this REST API.
   */
  access: {
    ttl: process.env.ACCESS_TOKEN_TTL || '10m',
    secret: process.env.ACCESS_TOKEN_SECRET || 'access',
  },

  /**
   * Used to refresh access token after it expires.
   */
  refresh: {
    ttl: process.env.REFRESH_TOKEN_TTL || '7d',
    extendedTtl: process.env.REFRESH_TOKEN_TTL_EXTENDED || '30d', // for remember_me
    secret: process.env.REFRESH_TOKEN_SECRET || 'refresh',
  },

  /**
   * Used as temporary token for verification.
   */
  verification: {
    ttl: process.env.VERIFY_TOKEN_TTL || '30m',
    secret: process.env.VERIFY_TOKEN_SECRET || 'verification',
  },
};
