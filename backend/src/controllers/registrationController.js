// Elite Fitness - QR Registration Controller
const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/database');
const { createOrder, verifyPaymentSignature } = require('../services/paymentService');
const { createAndSendOTP, verifyOTP } = require('../utils/otp');
const { generateToken } = require('../utils/jwt');
const emailService = require('../services/emailService');
const { sendNotificationToUser } = require('../services/fcmService');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

function generateRegistrationId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `EF${year}${month}${random}`;
}

function generateInvoiceNumber() {
  return `EF-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// POST /api/registrations/send-otp
async function sendRegistrationOTP(req, res) {
  const { email, phone } = req.body;

  // Check if account already exists
  const { rows } = await query(
    'SELECT id FROM users WHERE phone = $1',
    [phone]
  );

  if (rows.length > 0) {
    return errorResponse(res, 'An account with this phone number already exists. Please login to the Elite Fitness app.', null, 409);
  }

  if (email) {
    await createAndSendOTP(email, 'REGISTRATION');
    return successResponse(res, 'OTP sent to your email address.');
  }

  return errorResponse(res, 'Email is required to send OTP.');
}

// POST /api/registrations/verify-otp
async function verifyRegistrationOTP(req, res) {
  const { email, otp } = req.body;

  const result = await verifyOTP(email, otp, 'REGISTRATION');

  if (!result.valid) {
    return errorResponse(res, result.message, null, 400);
  }

  return successResponse(res, 'OTP verified successfully');
}

// POST /api/registrations/create-order
async function createRegistrationOrder(req, res) {
  const { plan_id, email, phone } = req.body;

  // Validate no duplicate (double check)
  const { rows: existingUser } = await query(
    'SELECT id FROM users WHERE phone = $1', [phone]
  );

  if (existingUser.length > 0) {
    return errorResponse(res, 'Account already exists for this phone number. Please login.', null, 409);
  }

  // Get plan details from DB (NEVER trust frontend price)
  const { rows: planRows } = await query(
    'SELECT * FROM membership_plans WHERE id = $1 AND status = $2',
    [plan_id, 'ACTIVE']
  );

  if (planRows.length === 0) {
    return errorResponse(res, 'Selected membership plan is not available.', null, 404);
  }

  const plan = planRows[0];
  const receipt = `qr_rcpt_${phone}_${Date.now()}`;
  const order = await createOrder(plan.price, 'INR', receipt);

  logger.info(`QR registration order created: ${order.id} for ${phone}`);

  return successResponse(res, 'Payment order created', {
    orderId: order.id,
    amount: plan.price,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    planName: plan.plan_name,
    planDuration: plan.duration_months,
  });
}

// POST /api/registrations/complete
async function completeRegistration(req, res) {
  const {
    // Personal details
    full_name, phone, email, date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, password,
    // Plan
    plan_id,
    // Payment
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  } = req.body;

  // CRITICAL: Verify payment signature on backend
  const isValid = verifyPaymentSignature(
    razorpay_order_id, razorpay_payment_id, razorpay_signature
  );

  if (!isValid) {
    logger.warn(`QR Registration: Payment verification FAILED for ${phone}`);
    return errorResponse(res, 'Payment verification failed. Please try again or contact Elite Fitness.', null, 400);
  }

  // Check for duplicate payment
  const { rows: dupCheck } = await query(
    'SELECT id FROM payments WHERE gateway_payment_id = $1 AND status = $2',
    [razorpay_payment_id, 'SUCCESS']
  );
  if (dupCheck.length > 0) {
    return errorResponse(res, 'This payment has already been processed.', null, 409);
  }

  // Check for duplicate registration
  const { rows: existingUser } = await query(
    'SELECT id FROM users WHERE phone = $1', [phone]
  );
  if (existingUser.length > 0) {
    return errorResponse(res, 'An account with this phone number already exists.', null, 409);
  }

  // Get plan from DB
  const { rows: planRows } = await query(
    'SELECT * FROM membership_plans WHERE id = $1 AND status = $2',
    [plan_id, 'ACTIVE']
  );

  if (planRows.length === 0) {
    return errorResponse(res, 'Membership plan not found.', null, 404);
  }

  const plan = planRows[0];

  const result = await withTransaction(async (client) => {
    // 1. Create user account
    const password_hash = await bcrypt.hash(password, 12);
    const { rows: userRows } = await client.query(
      `INSERT INTO users (full_name, phone, email, password_hash, role, status, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE', TRUE, TRUE)
       RETURNING id, full_name, phone, email, role`,
      [full_name, phone, email || null, password_hash]
    );
    const user = userRows[0];

    // 2. Create member record
    const registrationId = generateRegistrationId();
    const { rows: memberRows } = await client.query(
      `INSERT INTO members (user_id, date_of_birth, gender, address, emergency_contact_name,
        emergency_contact_phone, registration_id, status, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', CURRENT_DATE)
       RETURNING *`,
      [
        user.id, date_of_birth || null, gender || null, address || null,
        emergency_contact_name || null, emergency_contact_phone || null, registrationId
      ]
    );
    const member = memberRows[0];

    // 3. Create membership
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const { rows: mbRows } = await client.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
       VALUES ($1, $2, $3, $4, $5, 'PAID', 'ACTIVE')
       RETURNING *`,
      [member.id, plan.id, startDate, endDate, plan.price]
    );
    const membership = mbRows[0];

    // 4. Create payment record
    const invoiceNumber = generateInvoiceNumber();
    const { rows: paymentRows } = await client.query(
      `INSERT INTO payments (member_id, membership_id, amount, payment_method, gateway_order_id,
        gateway_payment_id, gateway_signature, invoice_number, status, payment_date)
       VALUES ($1, $2, $3, 'ONLINE', $4, $5, $6, $7, 'SUCCESS', NOW())
       RETURNING *`,
      [member.id, membership.id, plan.price, razorpay_order_id, razorpay_payment_id, razorpay_signature, invoiceNumber]
    );
    const payment = paymentRows[0];

    // 5. Create registration record
    await client.query(
      `INSERT INTO registrations (registration_id, full_name, phone, email, date_of_birth, gender,
        address, emergency_contact_name, emergency_contact_phone, selected_plan_id, payment_id, member_id, source, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'QR', 'COMPLETED')`,
      [
        registrationId, full_name, phone, email, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone, plan.id, payment.id, member.id
      ]
    );

    // Generate JWT token for immediate login
    const token = generateToken({ userId: user.id, role: user.role });

    return { user, member, membership, payment, plan, invoiceNumber, registrationId, token };
  });

  // Send welcome notifications (non-blocking)
  try {
    if (result.user.email) {
      await emailService.sendWelcomeEmail(
        result.user.email,
        result.user.full_name,
        result.registrationId,
        result.plan.plan_name,
        new Date(result.membership.end_date).toLocaleDateString('en-IN')
      );
    }
  } catch (emailErr) {
    logger.warn('Welcome email failed:', emailErr.message);
  }

  logger.info(`QR Registration completed: ${result.registrationId} (${phone})`);

  return successResponse(res, 'Registration successful! Welcome to Elite Fitness!', {
    registrationId: result.registrationId,
    memberName: result.user.full_name,
    planName: result.plan.plan_name,
    startDate: result.membership.start_date,
    endDate: result.membership.end_date,
    amountPaid: result.payment.amount,
    invoiceNumber: result.invoiceNumber,
    token: result.token,
    userId: result.user.id,
  }, 201);
}

// GET /api/registrations
async function getRegistrations(req, res) {
  const { page = 1, limit = 10, status } = req.query;
  const { offset, limit: lim } = require('../utils/response').getPagination(page, limit);

  let whereClause = status ? 'WHERE r.status = $1' : '';
  const params = status ? [status] : [];

  const { rows } = await query(
    `SELECT r.*, mp.plan_name, p.amount, p.status as payment_status, p.invoice_number
     FROM registrations r
     LEFT JOIN membership_plans mp ON mp.id = r.selected_plan_id
     LEFT JOIN payments p ON p.id = r.payment_id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, lim, offset]
  );

  return successResponse(res, 'Registrations retrieved', rows);
}

module.exports = { sendRegistrationOTP, verifyRegistrationOTP, createRegistrationOrder, completeRegistration, getRegistrations };
