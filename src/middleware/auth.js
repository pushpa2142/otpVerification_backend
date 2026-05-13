/**
 * Authentication Middleware
 * Validates JWT tokens on protected routes
 */

const { verifyToken } = require('../services/jwtService');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Middleware: Require a valid JWT Bearer token
 * Attaches the decoded user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, 'Access denied. Token is malformed.');
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Fetch the user to ensure they still exist
    const user = await User.findById(decoded.sub);
    if (!user) {
      return errorResponse(res, 401, 'Access denied. User no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);

    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token has expired. Please log in again.');
    }

    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token. Please log in again.');
    }

    return errorResponse(res, 500, 'Authentication error.');
  }
};

/**
 * Middleware: Require phone verification
 * Must be used AFTER authenticate
 */
const requirePhoneVerified = (req, res, next) => {
  if (!req.user?.isPhoneVerified) {
    return errorResponse(res, 403, 'Phone number verification required to access this resource.');
  }
  next();
};

module.exports = { authenticate, requirePhoneVerified };
