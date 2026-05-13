/**
 * Auth Controller
 * Handles: register, send OTP, verify OTP, get profile
 */

const { body } = require('express-validator');
const User = require('../models/User');
const { sendOTPViaSMS } = require('../services/smsService');
const { generateToken, buildTokenPayload } = require('../services/jwtService');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otp');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// ─── Validation Rules ──────────────────────────────────────────────────────────

/** Validates phone number in E.164 format */
const phoneValidation = body('phoneNumber')
  .trim()
  .notEmpty().withMessage('Phone number is required')
  .matches(/^\+[1-9]\d{1,14}$/).withMessage('Phone number must be in E.164 format (e.g., +14155552671)');

/** Validates 6-digit OTP code */
const otpValidation = body('otp')
  .trim()
  .notEmpty().withMessage('OTP code is required')
  .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
  .isNumeric().withMessage('OTP must contain only digits');

exports.sendOTPValidation = [phoneValidation];
exports.verifyOTPValidation = [phoneValidation, otpValidation];

// ─── Controller Methods ────────────────────────────────────────────────────────

/**
 * POST /api/auth/send-otp
 * Creates or finds a user by phone, generates OTP, sends SMS
 */
exports.sendOTP = async (req, res) => {
  const { phoneNumber } = req.body;
console.log(req.body,40000)
  try {
    // Find existing user or create a new one
    let user = await User.findOne({ phoneNumber }).select('+otp.expiresAt +otp.attempts');
    console.log(user,44)
    if (!user) {
      user = new User({ phoneNumber });
      logger.info(`New user created for phone: ${user.phoneNumber}`);
    } else {
      console.log(user.otp, user.otp?.expiresAt,499)
      // Rate-limit: prevent OTP spam (check if previous OTP is still fresh < 1 min old)
      if (user.otp?.expiresAt) {
        const timeLeft = new Date(user.otp.expiresAt) - Date.now();
        const ONE_MINUTE_MS = 60 * 1000;
        if (timeLeft > ONE_MINUTE_MS) {
          const waitSeconds = Math.ceil(timeLeft / 1000) - 60;
          return errorResponse(res, 429, `Please wait ${waitSeconds}s before requesting a new code.`);
        }
      }
    }

    // Generate OTP and expiry (2 minutes)
    const otpCode = generateOTP(parseInt(process.env.OTP_LENGTH, 10) || 6);
    const expiresAt = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 2);
    console.log(otpCode,6444)
    console.log(expiresAt,655555)

    await user.setOTP(otpCode, expiresAt);
    await user.save();

    // Send SMS (throws on failure)
    await sendOTPViaSMS(phoneNumber, otpCode);

    logger.info(`OTP sent to ${phoneNumber}`);

    return successResponse(res, 200, 'Verification code sent successfully. It expires in 2 minutes.', {
      phoneNumber: user.phoneNumber,
      expiresAt,
    });
  } catch (error) {
    logger.error(`sendOTP error for ${phoneNumber}: ${error.message}`);
    return errorResponse(res, 500, error.message || 'Failed to send verification code.');
  }
};

/**
 * POST /api/auth/verify-otp
 * Validates the OTP code and returns a JWT on success
 */
exports.verifyOTP = async (req, res) => {
  const { phoneNumber, otp } = req.body;
  const MAX_ATTEMPTS = 5;

  try {
    // Must fetch OTP fields (excluded from default projections)
    const user = await User.findOne({ phoneNumber }).select('+otp.code +otp.expiresAt +otp.attempts');

    if (!user) {
      return errorResponse(res, 404, 'No verification request found for this phone number. Please request a code first.');
    }

    if (!user.otp?.code) {
      return errorResponse(res, 400, 'No active verification code. Please request a new one.');
    }

    // Check expiry (2-minute window)
    if (isOTPExpired(user.otp.expiresAt)) {
      user.clearOTP();
      await user.save();
      return errorResponse(res, 400, 'Verification code has expired. Please request a new one.');
    }

    // Check attempt limit
    if (user.otp.attempts >= MAX_ATTEMPTS) {
      user.clearOTP();
      await user.save();
      return errorResponse(res, 429, 'Too many failed attempts. Please request a new verification code.');
    }

    // Verify the OTP
    const isValid = await user.verifyOTP(otp);

    if (!isValid) {
      user.otp.attempts += 1;
      await user.save();
      const remaining = MAX_ATTEMPTS - user.otp.attempts;
      return errorResponse(res, 400, `Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    // OTP is valid — mark phone as verified
    user.markPhoneVerified();
    await user.save();

    // Issue JWT
    const token = generateToken(buildTokenPayload(user));
    console.log(token,1355)
    console.log(user._id,13666)

    logger.info(`Phone verified for user ${user._id}`);

    return successResponse(res, 200, 'Phone number verified successfully!', {
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isPhoneVerified: user.isPhoneVerified,
        phoneVerifiedAt: user.phoneVerifiedAt,
      },
    });
  } catch (error) {
    logger.error(`verifyOTP error for ${phoneNumber}: ${error.message}`);
    return errorResponse(res, 500, 'Failed to verify code. Please try again.');
  }
};

/**
 * GET /api/auth/profile
 * Returns the authenticated user's profile (JWT required)
 */
exports.getProfile = async (req, res) => {
  try {
    const user = req.user; // Set by authenticate middleware

    return successResponse(res, 200, 'Profile retrieved successfully', {
      id: user._id,
      phoneNumber: user.phoneNumber,
      name: user.name || null,
      isPhoneVerified: user.isPhoneVerified,
      phoneVerifiedAt: user.phoneVerifiedAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    logger.error(`getProfile error: ${error.message}`);
    return errorResponse(res, 500, 'Failed to retrieve profile.');
  }
};

/**
 * GET /api/auth/status
 * Returns verification status for a given phone number (JWT required)
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const user = req.user;

    return successResponse(res, 200, 'Verification status retrieved', {
      phoneNumber: user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified,
      phoneVerifiedAt: user.phoneVerifiedAt,
    });
  } catch (error) {
    logger.error(`getVerificationStatus error: ${error.message}`);
    return errorResponse(res, 500, 'Failed to retrieve verification status.');
  }
};
