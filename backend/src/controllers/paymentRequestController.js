// Elite Fitness - Payment Request Controller (UTR Verification Flow)
const { query, withTransaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const logger = require('../utils/logger');

function generateInvoiceNumber() {
  const now = new Date();
  return `EF-UTR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`;
}

// POST /api/payment-requests  (CUSTOMER — submit UTR after paying via UPI)
async function submitPaymentRequest(req, res) {
  const userId = req.user.id;
  const { plan_id, utr_number, proof_note } = req.body;

  if (!plan_id || !utr_number) {
    return errorResponse(res, 'plan_id and utr_number are required.');
  }

  // Get member
  const { rows: memberRows } = await query(
    `SELECT id FROM members WHERE user_id = $1`,
    [userId]
  );
  if (memberRows.length === 0) {
    return errorResponse(res, 'Member profile not found.', null, 404);
  }
  const member_id = memberRows[0].id;

  // Get plan price from DB (never trust frontend price)
  const { rows: planRows } = await query(
    `SELECT id, plan_name, price FROM membership_plans WHERE id = $1 AND status = 'ACTIVE'`,
    [plan_id]
  );
  if (planRows.length === 0) {
    return errorResponse(res, 'Membership plan not found or inactive.', null, 404);
  }
  const plan = planRows[0];

  // Check for duplicate pending UTR
  const { rows: dupRows } = await query(
    `SELECT id FROM payment_requests WHERE utr_number = $1 AND status = 'PENDING'`,
    [utr_number]
  );
  if (dupRows.length > 0) {
    return errorResponse(res, 'A pending request with this UTR number already exists.', null, 409);
  }

  const { rows } = await query(
    `INSERT INTO payment_requests (member_id, plan_id, amount, utr_number, proof_note)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [member_id, plan_id, plan.price, utr_number, proof_note || null]
  );

  logger.info(`UTR payment request submitted: member_id=${member_id}, utr=${utr_number}, plan=${plan.plan_name}`);
  return successResponse(res, 'Payment request submitted successfully. Owner will verify shortly.', rows[0], 201);
}

// GET /api/payment-requests  (OWNER — list all with status filter)
async function getPaymentRequests(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  const { offset } = getPagination(page, limit);

  let conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (status) { conditions.push(`pr.status = $${idx++}`); params.push(status); }

  const countResult = await query(
    `SELECT COUNT(*) FROM payment_requests pr WHERE ${conditions.join(' AND ')}`,
    params
  );

  const { rows } = await query(
    `SELECT pr.*, 
            u.full_name as member_name, u.phone as member_phone,
            m.registration_id,
            mp.plan_name, mp.duration_months,
            verifier.full_name as verified_by_name
     FROM payment_requests pr
     INNER JOIN members m ON m.id = pr.member_id
     INNER JOIN users u ON u.id = m.user_id
     INNER JOIN membership_plans mp ON mp.id = pr.plan_id
     LEFT JOIN users verifier ON verifier.id = pr.verified_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY pr.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true,
    message: 'Payment requests retrieved',
    data: rows,
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit),
  });
}

// GET /api/payment-requests/me  (CUSTOMER — own requests)
async function getMyPaymentRequests(req, res) {
  const userId = req.user.id;

  const { rows: memberRows } = await query(`SELECT id FROM members WHERE user_id = $1`, [userId]);
  if (memberRows.length === 0) {
    return successResponse(res, 'No requests found', []);
  }

  const { rows } = await query(
    `SELECT pr.*, mp.plan_name, mp.duration_months
     FROM payment_requests pr
     INNER JOIN membership_plans mp ON mp.id = pr.plan_id
     WHERE pr.member_id = $1
     ORDER BY pr.created_at DESC`,
    [memberRows[0].id]
  );

  return successResponse(res, 'Your payment requests', rows);
}

// POST /api/payment-requests/:id/verify  (OWNER — verify UTR, activate membership)
async function verifyPaymentRequest(req, res) {
  const { id } = req.params;
  const ownerId = req.user.id;

  const { rows: reqRows } = await query(
    `SELECT pr.*, mp.duration_months, mp.price FROM payment_requests pr
     INNER JOIN membership_plans mp ON mp.id = pr.plan_id
     WHERE pr.id = $1`,
    [id]
  );

  if (reqRows.length === 0) {
    return errorResponse(res, 'Payment request not found.', null, 404);
  }

  const pr = reqRows[0];

  if (pr.status !== 'PENDING') {
    return errorResponse(res, `This request is already ${pr.status}.`, null, 409);
  }

  const result = await withTransaction(async (client) => {
    // Expire existing active memberships
    await client.query(
      `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
       WHERE member_id = $1 AND membership_status IN ('ACTIVE', 'FROZEN')`,
      [pr.member_id]
    );

    // Create new active membership
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + pr.duration_months);

    const { rows: mbRows } = await client.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
       VALUES ($1, $2, $3, $4, $5, 'PAID', 'ACTIVE')
       RETURNING *`,
      [pr.member_id, pr.plan_id, startDate, endDate, pr.amount]
    );

    const newMembership = mbRows[0];
    const invoiceNumber = generateInvoiceNumber();

    // Record payment entry
    await client.query(
      `INSERT INTO payments (member_id, membership_id, amount, payment_method, invoice_number, status, payment_date, notes)
       VALUES ($1, $2, $3, 'UPI', $4, 'SUCCESS', NOW(), $5)`,
      [pr.member_id, newMembership.id, pr.amount, invoiceNumber, `UTR: ${pr.utr_number}`]
    );

    // Update member status to ACTIVE
    await client.query(
      `UPDATE members SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
      [pr.member_id]
    );

    // Update user account to ACTIVE
    await client.query(
      `UPDATE users SET status = 'ACTIVE', updated_at = NOW()
       WHERE id = (SELECT user_id FROM members WHERE id = $1)`,
      [pr.member_id]
    );

    // Mark request as VERIFIED
    const { rows: updatedReq } = await client.query(
      `UPDATE payment_requests SET
         status = 'VERIFIED', verified_at = NOW(), verified_by = $1,
         activated_membership_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [ownerId, newMembership.id, id]
    );

    return { request: updatedReq[0], membership: newMembership, invoice: invoiceNumber };
  });

  logger.info(`UTR Verified: request_id=${id}, member_id=${pr.member_id}, utr=${pr.utr_number}`);
  return successResponse(res, `Payment verified! Membership activated until ${result.membership.end_date}`, result);
}

// POST /api/payment-requests/:id/reject  (OWNER)
async function rejectPaymentRequest(req, res) {
  const { id } = req.params;
  const ownerId = req.user.id;
  const { rejection_reason } = req.body;

  const { rows: reqRows } = await query(`SELECT * FROM payment_requests WHERE id = $1`, [id]);
  if (reqRows.length === 0) {
    return errorResponse(res, 'Payment request not found.', null, 404);
  }
  if (reqRows[0].status !== 'PENDING') {
    return errorResponse(res, `This request is already ${reqRows[0].status}.`, null, 409);
  }

  const { rows } = await query(
    `UPDATE payment_requests SET
       status = 'REJECTED', verified_at = NOW(), verified_by = $1,
       rejection_reason = $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [ownerId, rejection_reason || 'UTR number could not be verified.', id]
  );

  logger.info(`UTR Rejected: request_id=${id}, reason=${rejection_reason}`);
  return successResponse(res, 'Payment request rejected.', rows[0]);
}

module.exports = {
  submitPaymentRequest, getPaymentRequests, getMyPaymentRequests,
  verifyPaymentRequest, rejectPaymentRequest,
};
