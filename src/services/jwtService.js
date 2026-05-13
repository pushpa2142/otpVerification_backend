/**
 * JWT Service
 * Handles token generation, verification, and refresh
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for a given user payload
 * @param {object} payload - Data to embed in the token
 * @returns {string} Signed JWT
 */
const generateToken = (payload) => {
  console.log('----generateToken----',payload)
  console.log('--JWT_SECRET---',JWT_SECRET,'---',JWT_EXPIRES_IN,'---',)
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'phone-verify-api',
    audience: 'phone-verify-client',
  });
};

/**
 * Verify and decode a JWT
 * @param {string} token - JWT string
 * @returns {object} Decoded token payload
 * @throws {JsonWebTokenError|TokenExpiredError} On invalid/expired token
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'phone-verify-api',
    audience: 'phone-verify-client',
  });
};

/**
 * Build the standard token payload from a User document
 * @param {object} user - Mongoose User document
 * @returns {object} Token payload
 */
const buildTokenPayload = (user) => ({
  sub: user._id.toString(),
  phoneNumber: user.phoneNumber,
  isPhoneVerified: user.isPhoneVerified,
});

module.exports = { generateToken, verifyToken, buildTokenPayload };
