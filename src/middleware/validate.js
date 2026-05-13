/**
 * Validation Middleware
 * Runs express-validator checks and returns errors
 */

const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware factory: Run after express-validator chains
 * Returns 422 with field errors if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return errorResponse(res, 422, 'Validation failed', formattedErrors);
  }

  next();
};

module.exports = { validate };
