// Elite Fitness - Payment Controller (Razorpay + Verification)
const { query, withTransaction } = require('../config/database');
const { createOrder, verifyPaymentSignature } = require('../services/paymentService');
const { sendNotificationToUser } = require('../services/fcmService');
const emailService = require('../services/emailService');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const logger = require('../utils/logger');

function generateInvoiceNumber() {
  const now = new Date();
  return `EF-INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// POST /api/payments/create-order
async function createPaymentOrder(req, res) {
  const { member_id, plan_id, membership_id } = req.body;

  // Always get price from DB - NEVER trust frontend
  let amount;
  if (plan_id) {
    const { rows } = await query(
      'SELECT price, plan_name FROM membership_plans WHERE id = $1 AND status = $2',
      [plan_id, 'ACTIVE']
    );
    if (rows.length === 0) {
      return errorResponse(res, 'Membership plan not found.', null, 404);
    }
    amount = parseFloat(rows[0].price);
  } else if (membership_id) {
    const { rows } = await query(
      'SELECT price_paid FROM memberships WHERE id = $1',
      [membership_id]
    );
    if (rows.length === 0) {
      return errorResponse(res, 'Membership not found.', null, 404);
    }
    amount = parseFloat(rows[0].price_paid);
  } else {
    return errorResponse(res, 'plan_id or membership_id is required.');
  }

  // Check for existing pending order to prevent duplicates
  const { rows: existingOrders } = await query(
    `SELECT id, gateway_order_id FROM payments
     WHERE member_id = $1 AND membership_id = $2 AND status = 'PENDING'
     AND created_at > NOW() - INTERVAL '30 minutes'`,
    [member_id, membership_id || null]
  );

  if (existingOrders.length > 0 && existingOrders[0].gateway_order_id) {
    return successResponse(res, 'Existing order found', {
      orderId: existingOrders[0].gateway_order_id,
      amount,
      currency: 'INR',
    });
  }

  const receipt = `rcpt_${member_id}_${Date.now()}`;
  const order = await createOrder(amount, 'INR', receipt);

  // Store pending payment record
  const invoiceNumber = generateInvoiceNumber();
  await query(
    `INSERT INTO payments (member_id, membership_id, amount, payment_method, gateway_order_id, invoice_number, status)
     VALUES ($1, $2, $3, 'ONLINE', $4, $5, 'PENDING')`,
    [member_id, membership_id || null, amount, order.id, invoiceNumber]
  );

  logger.info(`Payment order created: ${order.id} for member ${member_id}`);

  return successResponse(res, 'Payment order created', {
    orderId: order.id,
    amount,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    invoiceNumber,
  });
}

// POST /api/payments/verify
async function verifyPayment(req, res) {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    member_id,
    plan_id,
    membership_id,
  } = req.body;

  // CRITICAL: Verify payment signature on backend
  const isValid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValid) {
    logger.warn(`Payment signature verification FAILED for order: ${razorpay_order_id}`);

    // Mark payment as failed
    await query(
      `UPDATE payments SET status = 'FAILED', gateway_payment_id = $1, updated_at = NOW()
       WHERE gateway_order_id = $2`,
      [razorpay_payment_id, razorpay_order_id]
    );

    return errorResponse(res, 'Payment verification failed. Please contact Elite Fitness support.', null, 400);
  }

  // Check for duplicate payment (prevent replay attacks)
  const { rows: dupCheck } = await query(
    'SELECT id FROM payments WHERE gateway_payment_id = $1 AND status = $2',
    [razorpay_payment_id, 'SUCCESS']
  );

  if (dupCheck.length > 0) {
    return errorResponse(res, 'Payment already processed.', null, 409);
  }

  const result = await withTransaction(async (client) => {
    // Update payment record to SUCCESS
    const { rows: paymentRows } = await client.query(
      `UPDATE payments SET
         status = 'SUCCESS',
         gateway_payment_id = $1,
         gateway_signature = $2,
         payment_date = NOW(),
         payment_method = 'ONLINE',
         updated_at = NOW()
       WHERE gateway_order_id = $3
       RETURNING *`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );

    if (paymentRows.length === 0) {
      throw new Error('Payment record not found.');
    }

    const payment = paymentRows[0];

    // Activate or create membership
    let activatedMembership = null;

    if (membership_id) {
      // Update existing membership
      const { rows: mbRows } = await client.query(
        `UPDATE memberships SET payment_status = 'PAID', membership_status = 'ACTIVE', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [membership_id]
      );
      activatedMembership = mbRows[0];
    } else if (plan_id) {
      // Get plan details (from DB, not frontend)
      const { rows: planRows } = await client.query(
        'SELECT * FROM membership_plans WHERE id = $1',
        [plan_id]
      );

      if (planRows.length === 0) throw new Error('Plan not found.');
      const plan = planRows[0];

      // Expire existing memberships
      await client.query(
        `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
         WHERE member_id = $1 AND membership_status = 'ACTIVE'`,
        [member_id]
      );

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      const { rows: mbRows } = await client.query(
        `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
         VALUES ($1, $2, $3, $4, $5, 'PAID', 'ACTIVE')
         RETURNING *`,
        [member_id, plan_id, startDate, endDate, plan.price]
      );

      activatedMembership = mbRows[0];

      // Link payment to membership
      await client.query(
        'UPDATE payments SET membership_id = $1 WHERE id = $2',
        [activatedMembership.id, payment.id]
      );
    }

    // Update member status
    await client.query(
      `UPDATE members SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
      [member_id]
    );

    return { payment, membership: activatedMembership };
  });

  // Send notifications (async, non-blocking)
  try {
    const { rows: memberRows } = await query(
      `SELECT u.email, u.full_name, u.id as user_id FROM members m
       INNER JOIN users u ON u.id = m.user_id WHERE m.id = $1`,
      [member_id]
    );

    if (memberRows.length > 0) {
      const user = memberRows[0];

      // FCM notification
      await sendNotificationToUser(
        user.user_id,
        'Payment Successful ✅',
        `Your payment of ₹${result.payment.amount} has been confirmed. Membership activated!`,
        'PAYMENT',
        { paymentId: razorpay_payment_id }
      );

      // Email confirmation
      if (user.email) {
        const { rows: planRows } = await query(
          'SELECT plan_name FROM membership_plans WHERE id = (SELECT plan_id FROM memberships WHERE id = $1)',
          [result.membership?.id]
        );
        await emailService.sendPaymentConfirmationEmail(
          user.email,
          user.full_name,
          result.payment.amount,
          planRows[0]?.plan_name || 'Membership',
          result.payment.invoice_number,
          new Date().toLocaleDateString('en-IN')
        );
      }
    }
  } catch (notifErr) {
    logger.warn('Notification/email after payment failed:', notifErr.message);
  }

  logger.info(`Payment verified and membership activated: orderId=${razorpay_order_id}`);

  return successResponse(res, 'Payment verified successfully. Membership activated!', {
    payment: result.payment,
    membership: result.membership,
  });
}

// GET /api/payments
async function getPayments(req, res) {
  const { page = 1, limit = 10, status, method, member_id, from_date, to_date } = req.query;
  const { offset } = getPagination(page, limit);

  let conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (status) { conditions.push(`p.status = $${idx++}`); params.push(status); }
  if (method) { conditions.push(`p.payment_method = $${idx++}`); params.push(method); }
  if (member_id) { conditions.push(`p.member_id = $${idx++}`); params.push(member_id); }
  if (from_date) { conditions.push(`p.payment_date >= $${idx++}`); params.push(from_date); }
  if (to_date) { conditions.push(`p.payment_date <= $${idx++}`); params.push(to_date); }

  const countResult = await query(
    `SELECT COUNT(*) FROM payments p WHERE ${conditions.join(' AND ')}`, params
  );

  const { rows } = await query(
    `SELECT p.*, u.full_name, u.phone, m.registration_id, mp.plan_name
     FROM payments p
     LEFT JOIN members mem ON mem.id = p.member_id
     LEFT JOIN users u ON u.id = mem.user_id
     LEFT JOIN members m ON m.id = p.member_id
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true,
    message: 'Payments retrieved',
    data: rows,
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit),
  });
}

// GET /api/payments/:id (invoice details)
async function getPaymentById(req, res) {
  const { rows } = await query(
    `SELECT p.*, u.full_name, u.phone, u.email, m.registration_id,
            mp.plan_name, mp.duration_months, mb.start_date, mb.end_date,
            gs.gym_name, gs.phone as gym_phone, gs.address as gym_address
     FROM payments p
     LEFT JOIN members mem ON mem.id = p.member_id
     LEFT JOIN users u ON u.id = mem.user_id
     LEFT JOIN members m ON m.id = p.member_id
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     CROSS JOIN gym_settings gs
     WHERE p.id = $1`,
    [req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Payment not found.', null, 404);
  return successResponse(res, 'Payment details retrieved', rows[0]);
}

module.exports = { createPaymentOrder, verifyPayment, getPayments, getPaymentById };
