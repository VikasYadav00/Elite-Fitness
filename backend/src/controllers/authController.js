// Elite Fitness - Authentication Controller
const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { createAndSendOTP, verifyOTP } = require('../utils/otp');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// POST /api/auth/register
async function register(req, res) {
  const { full_name, phone, email, password } = req.body;

  // Check if user already exists
  const { rows: existing } = await query(
    'SELECT id FROM users WHERE phone = $1 OR ($2::text IS NOT NULL AND email = $2)',
    [phone, email || null]
  );

  if (existing.length > 0) {
    return errorResponse(res, 'An account with this phone number or email already exists.', null, 409);
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { rows } = await query(
    `INSERT INTO users (full_name, phone, email, password_hash, role, status)
     VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE')
     RETURNING id, full_name, phone, email, role`,
    [full_name, phone, email || null, password_hash]
  );

  const user = rows[0];
  const token = generateToken({ userId: user.id, role: user.role });

  // Send OTP for phone verification
  if (email) {
    try {
      await createAndSendOTP(email, 'REGISTRATION');
    } catch (e) {
      logger.warn('Could not send registration OTP:', e.message);
    }
  }

  logger.info(`New user registered: ${user.id} (${user.phone})`);

  return successResponse(res, 'Registration successful', { user, token }, 201);
}

// POST /api/auth/login
async function login(req, res) {
  const { phone, email, password } = req.body;

  const identifier = phone || email;
  if (!identifier) {
    return errorResponse(res, 'Phone number or email is required.');
  }

  const { rows } = await query(
    'SELECT * FROM users WHERE phone = $1 OR email = $1',
    [identifier]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Invalid credentials.', null, 401);
  }

  const user = rows[0];

  if (user.status !== 'ACTIVE') {
    return errorResponse(res, 'Your account is suspended. Please contact Elite Fitness.', null, 403);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return errorResponse(res, 'Invalid credentials.', null, 401);
  }

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const token = generateToken({ userId: user.id, role: user.role });

  // Get member/trainer details if applicable
  let profileData = null;
  if (user.role === 'CUSTOMER') {
    const { rows: memberRows } = await query(
      'SELECT id, status, registration_id, profile_photo_url FROM members WHERE user_id = $1',
      [user.id]
    );
    profileData = memberRows[0] || null;
  } else if (user.role === 'TRAINER') {
    const { rows: trainerRows } = await query(
      'SELECT id, status, specialization, profile_photo_url FROM trainers WHERE user_id = $1',
      [user.id]
    );
    profileData = trainerRows[0] || null;
  }

  logger.info(`User logged in: ${user.id} (${user.role})`);

  return successResponse(res, 'Login successful', {
    user: {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    token,
    profile: profileData,
  });
}

// POST /api/auth/send-otp
async function sendOTP(req, res) {
  const { email, purpose } = req.body;

  const validPurposes = ['REGISTRATION', 'FORGOT_PASSWORD', 'PHONE_VERIFY', 'LOGIN'];
  if (!validPurposes.includes(purpose)) {
    return errorResponse(res, 'Invalid OTP purpose.');
  }

  if (purpose === 'FORGOT_PASSWORD') {
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      // Security: don't reveal if email exists
      return successResponse(res, 'If this email is registered, an OTP has been sent.');
    }
  }

  const result = await createAndSendOTP(email, purpose);
  return successResponse(res, result.message, { expiresIn: result.expiresIn });
}

// POST /api/auth/verify-otp
async function verifyOTPRoute(req, res) {
  const { email, otp, purpose } = req.body;

  const result = await verifyOTP(email, otp, purpose);

  if (!result.valid) {
    return errorResponse(res, result.message, null, 400);
  }

  // Mark email as verified
  if (purpose === 'REGISTRATION' || purpose === 'PHONE_VERIFY') {
    await query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);
  }

  // Generate reset token for forgot password flow
  let resetToken = null;
  if (purpose === 'FORGOT_PASSWORD') {
    const { rows } = await query(
      'SELECT id, role FROM users WHERE email = $1',
      [email]
    );
    if (rows.length > 0) {
      resetToken = generateToken({ userId: rows[0].id, purpose: 'PASSWORD_RESET' });
    }
  }

  return successResponse(res, result.message, { resetToken });
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
  const { email } = req.body;

  const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (rows.length === 0) {
    return successResponse(res, 'If this email is registered, an OTP has been sent.');
  }

  await createAndSendOTP(email, 'FORGOT_PASSWORD');
  return successResponse(res, 'OTP sent to your registered email address.');
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
  const { email, otp, new_password } = req.body;

  // Verify OTP
  const otpResult = await verifyOTP(email, otp, 'FORGOT_PASSWORD');
  if (!otpResult.valid) {
    return errorResponse(res, otpResult.message, null, 400);
  }

  const password_hash = await bcrypt.hash(new_password, 12);

  const { rows } = await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
    [password_hash, email]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'User not found.', null, 404);
  }

  logger.info(`Password reset for user with email: ${email}`);
  return successResponse(res, 'Password reset successfully. Please login with your new password.');
}

// POST /api/auth/change-password (authenticated)
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  const userId = req.user.id;

  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) {
    return errorResponse(res, 'User not found.', null, 404);
  }

  const isValid = await bcrypt.compare(current_password, rows[0].password_hash);
  if (!isValid) {
    return errorResponse(res, 'Current password is incorrect.', null, 400);
  }

  const password_hash = await bcrypt.hash(new_password, 12);
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [password_hash, userId]
  );

  return successResponse(res, 'Password changed successfully.');
}

// PUT /api/auth/fcm-token
async function updateFcmToken(req, res) {
  const { fcm_token } = req.body;
  await query('UPDATE users SET fcm_token = $1 WHERE id = $2', [fcm_token, req.user.id]);
  return successResponse(res, 'FCM token updated successfully.');
}

// POST /api/auth/logout
async function logout(req, res) {
  // Clear FCM token on logout
  await query('UPDATE users SET fcm_token = NULL WHERE id = $1', [req.user.id]);
  return successResponse(res, 'Logged out successfully.');
}

module.exports = { register, login, sendOTP, verifyOTPRoute, forgotPassword, resetPassword, changePassword, updateFcmToken, logout };
