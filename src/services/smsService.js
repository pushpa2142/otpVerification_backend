/**
 * SMS Service
 * Abstracts SMS sending via Twilio (or fallback mock for development)
 */

const { getTwilioClient } = require('../config/twilio');
const logger = require('../utils/logger');

/**
 * Send an OTP via SMS using Twilio
 * Falls back to console logging in development if Twilio is not configured
 *
 * @param {string} toPhoneNumber - Recipient phone number (E.164 format)
 * @param {string} otpCode - The OTP to send
 * @returns {Promise<{success: boolean, messageId?: string}>}
 */
const sendOTPViaSMS = async (toPhoneNumber, otpCode) => {
  // console.log('--------sendOTPViaSMS------------',process.env.NODE_ENV)
  const messageBody = `Your verification code is: ${otpCode}. It expires in 2 minutes. Do not share this code with anyone.`;
// console.log(toPhoneNumber, otpCode,20000000)
  // ── Development fallback ──────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development' && !process.env.TWILIO_ACCOUNT_SID) {
    logger.warn(`[DEV MODE] SMS not sent. OTP for ${toPhoneNumber}: ${otpCode}`);
    return { success: true, messageId: 'dev-mock-message-id' };
  }

  // ── Production: send via Twilio ───────────────────────────────────────────
  try {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    console.log(fromNumber,'===',process.env.TWILIO_PHONE_NUMBER,31111)

    if (!fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is not configured');
    }

    const message = await client.messages.create({
      body: messageBody,
      from: fromNumber,
      to: toPhoneNumber,
    });
    console.log(message,4222)
    logger.info(`SMS sent to ${toPhoneNumber} | SID: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    logger.error(`Failed to send SMS to ${toPhoneNumber}: ${error.message}`);
    throw new Error(`SMS delivery failed: ${error.message}`);
  }
};

module.exports = { sendOTPViaSMS };
