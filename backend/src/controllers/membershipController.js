// Elite Fitness - Membership Plan & Membership Controller
const { query, withTransaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const logger = require('../utils/logger');

// ==================== MEMBERSHIP PLANS ====================

// GET /api/membership-plans
async function getPlans(req, res) {
  const { status = 'ACTIVE' } = req.query;

  let whereClause = status !== 'all' ? "WHERE status = $1" : '';
  const params = status !== 'all' ? [status] : [];

  const { rows } = await query(
    `SELECT * FROM membership_plans ${whereClause} ORDER BY duration_months ASC`,
    params
  );

  return successResponse(res, 'Membership plans retrieved', rows);
}

// GET /api/membership-plans/:id
async function getPlanById(req, res) {
  const { rows } = await query(
    'SELECT * FROM membership_plans WHERE id = $1',
    [req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Plan not found.', null, 404);
  return successResponse(res, 'Plan retrieved', rows[0]);
}

// POST /api/membership-plans
async function createPlan(req, res) {
  const { plan_name, duration_months, price, description, features } = req.body;

  const { rows } = await query(
    `INSERT INTO membership_plans (plan_name, duration_months, price, description, features, status)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
     RETURNING *`,
    [plan_name, duration_months, price, description || null, JSON.stringify(features || [])]
  );

  return successResponse(res, 'Membership plan created', rows[0], 201);
}

// PUT /api/membership-plans/:id
async function updatePlan(req, res) {
  const { plan_name, duration_months, price, description, features, status } = req.body;

  const { rows } = await query(
    `UPDATE membership_plans SET
       plan_name = COALESCE($1, plan_name),
       duration_months = COALESCE($2, duration_months),
       price = COALESCE($3, price),
       description = COALESCE($4, description),
       features = COALESCE($5, features),
       status = COALESCE($6, status),
       updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [plan_name, duration_months, price, description, features ? JSON.stringify(features) : null, status, req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Plan not found.', null, 404);
  return successResponse(res, 'Plan updated', rows[0]);
}

// ==================== MEMBERSHIPS ====================

// GET /api/memberships
async function getMemberships(req, res) {
  const { page = 1, limit = 10, status, member_id } = req.query;
  const { offset } = getPagination(page, limit);

  let whereConditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (status) { whereConditions.push(`mb.membership_status = $${idx++}`); params.push(status); }
  if (member_id) { whereConditions.push(`mb.member_id = $${idx++}`); params.push(member_id); }

  const countResult = await query(
    `SELECT COUNT(*) FROM memberships mb WHERE ${whereConditions.join(' AND ')}`, params
  );

  const { rows } = await query(
    `SELECT mb.*, mp.plan_name, mp.duration_months, mp.price as plan_price,
            u.full_name as member_name, u.phone as member_phone,
            m.registration_id
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     INNER JOIN members m ON m.id = mb.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY mb.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true,
    message: 'Memberships retrieved',
    data: rows,
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit),
  });
}

// GET /api/memberships/expiring-soon
async function getExpiringSoon(req, res) {
  const { days = 30 } = req.query;

  const { rows } = await query(
    `SELECT mb.*, mp.plan_name, u.full_name, u.phone, u.email, m.registration_id,
            (mb.end_date - CURRENT_DATE) as days_remaining
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     INNER JOIN members m ON m.id = mb.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE mb.membership_status = 'ACTIVE'
       AND mb.end_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
       AND mb.end_date >= CURRENT_DATE
     ORDER BY mb.end_date ASC`
  );

  return successResponse(res, 'Expiring memberships retrieved', rows);
}

// POST /api/memberships/assign
async function assignMembership(req, res) {
  const { member_id, plan_id, start_date, payment_method = 'CASH', amount_paid } = req.body;

  // Verify plan exists and get price from DB (never trust frontend)
  const { rows: planRows } = await query(
    'SELECT * FROM membership_plans WHERE id = $1 AND status = $2',
    [plan_id, 'ACTIVE']
  );

  if (planRows.length === 0) {
    return errorResponse(res, 'Membership plan not found or inactive.', null, 404);
  }

  const plan = planRows[0];
  const price = amount_paid !== undefined ? parseFloat(amount_paid) : parseFloat(plan.price);

  const result = await withTransaction(async (client) => {
    // Deactivate existing active memberships
    await client.query(
      `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
       WHERE member_id = $1 AND membership_status = 'ACTIVE'`,
      [member_id]
    );

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const { rows: mbRows } = await client.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
       RETURNING *`,
      [member_id, plan_id, startDate, endDate, price, payment_method === 'ONLINE' ? 'PENDING' : 'PAID']
    );

    const membership = mbRows[0];

    // Create payment record for cash/UPI
    if (payment_method !== 'ONLINE') {
      const invoiceNumber = `EF-INV-${Date.now()}`;
      await client.query(
        `INSERT INTO payments (member_id, membership_id, amount, payment_method, invoice_number, status, payment_date)
         VALUES ($1, $2, $3, $4, $5, 'SUCCESS', NOW())`,
        [member_id, membership.id, price, payment_method, invoiceNumber]
      );
    }

    // Update member status
    await client.query(
      `UPDATE members SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1`,
      [member_id]
    );

    return membership;
  });

  logger.info(`Membership assigned: member_id=${member_id}, plan_id=${plan_id}`);
  return successResponse(res, 'Membership assigned successfully', result, 201);
}

// POST /api/memberships/:id/freeze
async function freezeMembership(req, res) {
  const { id } = req.params;

  const { rows } = await query(
    `UPDATE memberships SET is_frozen = TRUE, frozen_at = NOW(), membership_status = 'FROZEN', updated_at = NOW()
     WHERE id = $1 AND membership_status = 'ACTIVE'
     RETURNING *`,
    [id]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Active membership not found.', null, 404);
  }

  return successResponse(res, 'Membership frozen successfully', rows[0]);
}

// POST /api/memberships/:id/unfreeze
async function unfreezeMembership(req, res) {
  const { id } = req.params;

  const { rows: mbRows } = await query(
    'SELECT * FROM memberships WHERE id = $1 AND membership_status = $2',
    [id, 'FROZEN']
  );

  if (mbRows.length === 0) {
    return errorResponse(res, 'Frozen membership not found.', null, 404);
  }

  const mb = mbRows[0];
  const frozenDays = Math.ceil(
    (new Date() - new Date(mb.frozen_at)) / (1000 * 60 * 60 * 24)
  );

  // Extend end_date by frozen days
  const newEndDate = new Date(mb.end_date);
  newEndDate.setDate(newEndDate.getDate() + frozenDays);

  const { rows } = await query(
    `UPDATE memberships SET
       is_frozen = FALSE, unfrozen_at = NOW(), membership_status = 'ACTIVE',
       end_date = $1, freeze_days = freeze_days + $2, updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [newEndDate, frozenDays, id]
  );

  return successResponse(res, 'Membership unfrozen successfully', rows[0]);
}

// GET /api/memberships/member/:memberId
async function getMemberMemberships(req, res) {
  const { memberId } = req.params;

  const { rows } = await query(
    `SELECT mb.*, mp.plan_name, mp.duration_months, mp.description,
            (mb.end_date - CURRENT_DATE) as days_remaining
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE mb.member_id = $1
     ORDER BY mb.created_at DESC`,
    [memberId]
  );

  return successResponse(res, 'Membership history retrieved', rows);
}

module.exports = {
  getPlans, getPlanById, createPlan, updatePlan,
  getMemberships, getExpiringSoon, assignMembership, freezeMembership, unfreezeMembership, getMemberMemberships
};
