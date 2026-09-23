// Elite Fitness - OTP Utilities
const crypto = require('crypto');
const { query } = require('../config/database');
const emailService = require('../services/emailService');
const logger = require('./logger');

const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_IN_MINUTES) || 10;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createAndSendOTP(identifier, purpose) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

  // Invalidate existing OTPs for this identifier + purpose
  await query(
    'UPDATE otp_records SET is_used = TRUE WHERE identifier = $1 AND purpose = $2 AND is_used = FALSE',
    [identifier, purpose]
  );

  // Create new OTP record
  await query(
    `INSERT INTO otp_records (identifier, otp_code, purpose, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [identifier, otp, purpose, expiresAt]
  );

  // Send OTP via email
  try {
    await emailService.sendOTPEmail(identifier, otp, purpose);
    logger.info(`OTP sent to ${identifier} for ${purpose}`);
  } catch (err) {
    logger.error(`Failed to send OTP email to ${identifier}:`, err.message);
    // Don't throw - OTP is still stored in DB for testing
  }

  return { message: `OTP sent to ${identifier}`, expiresIn: OTP_EXPIRES_MINUTES };
}

async function verifyOTP(identifier, otp, purpose) {
  // Fetch the latest non-used OTP
  const { rows } = await query(
    `SELECT * FROM otp_records
     WHERE identifier = $1 AND purpose = $2 AND is_used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [identifier, purpose]
  );

  if (rows.length === 0) {
    return { valid: false, message: 'No OTP found. Please request a new OTP.' };
  }

  const record = rows[0];

  // Check expiry
  if (new Date() > new Date(record.expires_at)) {
    await query('UPDATE otp_records SET is_used = TRUE WHERE id = $1', [record.id]);
    return { valid: false, message: 'OTP has expired. Please request a new one.' };
  }

  // Check max attempts
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await query('UPDATE otp_records SET is_used = TRUE WHERE id = $1', [record.id]);
    return { valid: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  // Increment attempts
  await query('UPDATE otp_records SET attempts = attempts + 1 WHERE id = $1', [record.id]);

  // Verify OTP
  if (record.otp_code !== otp) {
    const remaining = OTP_MAX_ATTEMPTS - record.attempts - 1;
    return {
      valid: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark as used
  await query('UPDATE otp_records SET is_used = TRUE WHERE id = $1', [record.id]);
  return { valid: true, message: 'OTP verified successfully' };
}

module.exports = { generateOTP, createAndSendOTP, verifyOTP };
