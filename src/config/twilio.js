/**
 * Twilio Configuration
 * Initializes and exports Twilio client
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

let twilioClient = null;

/**
 * Get or initialize Twilio client (lazy initialization)
 * @returns {twilio.Twilio} Twilio client instance
 */
const getTwilioClient = () => {
  // console.log('----------------getTwilioClient----------------')
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are not configured');
  }

  twilioClient = twilio(accountSid, authToken);
  console.log('----initialized-------------',twilioClient)
  logger.info('Twilio client initialized');
  return twilioClient;
};

module.exports = { getTwilioClient };
