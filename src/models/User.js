/**
 * User Model
 * Defines the schema for user accounts with phone verification tracking
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Phone number in E.164 format (e.g., +14155552671)
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, 'Phone number must be in E.164 format (e.g., +14155552671)'],
    },

    // Phone verification status
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // OTP fields (transient; cleared after verification)
    otp: {
      code: { type: String, select: false },       // Hashed OTP
      expiresAt: { type: Date, select: false },     // 2-minute expiry
      attempts: { type: Number, default: 0, select: false }, // Failed attempt counter
    },

    // Timestamps for verification events
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },

    // Optional display name
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ 'otp.expiresAt': 1 }, { expireAfterSeconds: 0 }); // TTL hint

// ─── Methods ──────────────────────────────────────────────────────────────────

/**
 * Hash and store OTP code on the user document
 * @param {string} otpCode - Plain text OTP
 * @param {Date} expiresAt - Expiry timestamp
 */
userSchema.methods.setOTP = async function (otpCode, expiresAt) {
  const salt = await bcrypt.genSalt(10);
  this.otp.code = await bcrypt.hash(otpCode, salt);
  this.otp.expiresAt = expiresAt;
  this.otp.attempts = 0;
};

/**
 * Verify an OTP code against the stored hash
 * @param {string} otpCode - Plain text OTP to verify
 * @returns {boolean} Whether the code matches
 */
userSchema.methods.verifyOTP = async function (otpCode) {
  if (!this.otp?.code) return false;
  return bcrypt.compare(otpCode, this.otp.code);
};

/**
 * Clear OTP fields after successful verification or too many attempts
 */
userSchema.methods.clearOTP = function () {
  this.otp = { code: undefined, expiresAt: undefined, attempts: 0 };
};

/**
 * Mark phone number as verified
 */
userSchema.methods.markPhoneVerified = function () {
  this.isPhoneVerified = true;
  this.phoneVerifiedAt = new Date();
  this.clearOTP();
};

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('maskedPhone').get(function () {
  if (!this.phoneNumber) return null;
  const num = this.phoneNumber;
  return num.slice(0, 3) + '****' + num.slice(-4);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
