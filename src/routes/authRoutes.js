/**
 * Auth Routes
 * All routes under /api/auth
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/** Strict limiter for OTP sending (prevent SMS abuse) */
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Slightly looser limiter for OTP verification */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many verification attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * @route  POST /api/auth/send-otp
 * @desc   Send OTP to phone number
 * @access Public
 */
router.post(
  '/send-otp',
  otpSendLimiter,
  authController.sendOTPValidation,
  validate,
  authController.sendOTP
);

/**
 * @route  POST /api/auth/verify-otp
 * @desc   Verify OTP and receive JWT
 * @access Public
 */
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  authController.verifyOTPValidation,
  validate,
  authController.verifyOTP
);

/**
 * @route  GET /api/auth/profile
 * @desc   Get authenticated user profile
 * @access Private (JWT required)
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route  GET /api/auth/status
 * @desc   Get phone verification status
 * @access Private (JWT required)
 */
router.get('/status', authenticate, authController.getVerificationStatus);

module.exports = router;
