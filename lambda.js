/**
 * AWS Lambda Handler
 * Wraps the Express app using serverless-http for API Gateway integration
 *
 * Install: npm install serverless-http
 */

require('dotenv').config();
const serverless = require('serverless-http');
const app = require('./src/app');

/**
 * Lambda handler export
 * API Gateway → Lambda → serverless-http → Express middleware chain
 */
module.exports.handler = serverless(app, {
  /**
   * Transform the Lambda event before passing to Express.
   * Useful for normalizing API Gateway v1/v2 payloads.
   */
  request(req, event) {
    // Attach raw Lambda event for any middleware that needs it
    req.lambdaEvent = event;
  },
});
