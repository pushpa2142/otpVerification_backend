/**
 * OTP Utility
 * Functions for generating and validating OTP codes
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure OTP
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} Generated OTP code
 */
const generateOTP = (length = 6) => {
  // console.log('---------------generateOTP--------------')
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % digits.length];
  }
  return otp;
};

/**
 * Calculate OTP expiry timestamp
 * @param {number} minutes - Expiry duration in minutes (default: 2)
 * @returns {Date} Expiry date object
 */
const getOTPExpiry = (minutes = 2) => {
    // console.log('------------getOTPExpiry-------------')
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if an OTP has expired
 * @param {Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} True if expired
 */
const isOTPExpired = (expiresAt) => {
  //  console.log('------------isOTPExpired-------------')
  return new Date() > new Date(expiresAt);
};

module.exports = { generateOTP, getOTPExpiry, isOTPExpired };
