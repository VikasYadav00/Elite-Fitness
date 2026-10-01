// Elite Fitness - Member Controller
const { query, withTransaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const { uploadImage } = require('../services/cloudinaryService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

function generateRegistrationId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `EF${year}${month}${random}`;
}

function generateInvoiceNumber() {
  return `EF-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// GET /api/members
async function getMembers(req, res) {
  const { page = 1, limit = 10, search, status, trainer_id } = req.query;
  const { offset } = getPagination(page, limit);

  let whereConditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (search && search.trim()) {
    whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR m.registration_id ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  if (status && status !== 'ALL') {
    whereConditions.push(`m.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }

  if (trainer_id) {
    whereConditions.push(`m.trainer_id = $${paramIndex}`);
    params.push(trainer_id);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');

  const countResult = await query(
    `SELECT COUNT(*) FROM members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE ${whereClause}`,
    params
  );

  const { rows } = await query(
    `SELECT m.*, u.full_name, u.phone, u.email, u.status as user_status,
            t_user.full_name as trainer_name,
            mp.plan_name, mb.end_date as membership_end_date, mb.membership_status,
            mb.payment_status, p.amount as amount_paid, p.payment_method
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN trainers t ON t.id = m.trainer_id
     LEFT JOIN users t_user ON t_user.id = t.user_id
     LEFT JOIN memberships mb ON mb.member_id = m.id AND mb.membership_status = 'ACTIVE'
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     LEFT JOIN payments p ON p.member_id = m.id AND p.status = 'SUCCESS'
     WHERE ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, parseInt(limit), offset]
  );

  const total = parseInt(countResult.rows[0]?.count || rows.length);

  return res.json({
    success: true,
    message: 'Members retrieved successfully',
    data: rows,
    members: rows, // Dual compatibility for both array and { members } formats
    pagination: formatPagination(total, page, limit),
  });
}

// GET /api/members/:id
async function getMemberById(req, res) {
  const { id } = req.params;

  let whereParam = id;
  let whereSql = 'WHERE m.id = $1';
  if (isNaN(Number(id))) {
    whereSql = 'WHERE UPPER(m.registration_id) = UPPER($1)';
  }

  const { rows } = await query(
    `SELECT m.*, u.full_name, u.phone, u.email, u.status as user_status, u.last_login,
            t.id as trainer_id, t_user.full_name as trainer_name, t.specialization as trainer_specialization,
            t.user_id as trainer_user_id
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN trainers t ON t.id = m.trainer_id
     LEFT JOIN users t_user ON t_user.id = t.user_id
     ${whereSql}`,
    [whereParam]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  const member = rows[0];

  // Get active membership
  const { rows: memberships } = await query(
    `SELECT mb.*, mp.plan_name, mp.duration_months, mp.price
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE mb.member_id = $1
     ORDER BY mb.created_at DESC LIMIT 1`,
    [member.id]
  );

  member.current_membership = memberships[0] || null;

  return successResponse(res, 'Member retrieved successfully', member);
}

// POST /api/members (Owner creates a new member with full plan, membership & payment linking)
async function createMember(req, res) {
  const {
    full_name, phone, email, password, date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, trainer_id, notes,
    plan_id = 1, plan_name, duration_months = 3, amount_paid,
    payment_method = 'UPI', utr_number, proof_note, instant_verify = true, status = 'ACTIVE'
  } = req.body;

  if (!full_name || !full_name.trim() || !phone || !phone.trim()) {
    return errorResponse(res, 'Full name and phone number are required.', null, 400);
  }

  const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);

  const result = await withTransaction(async (client) => {
    // 1. Create or find user account
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE phone = $1',
      [cleanPhone]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const defaultPassword = password || `Elite@${cleanPhone.slice(-4)}`;
      const password_hash = await bcrypt.hash(defaultPassword, 12);

      const { rows: userRows } = await client.query(
        `INSERT INTO users (full_name, phone, email, password_hash, role, status, email_verified, phone_verified)
         VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE', 1, 1)
         RETURNING id`,
        [full_name.trim(), cleanPhone, email ? email.trim() : null, password_hash]
      );
      userId = userRows[0].id;
    }

    const registrationId = generateRegistrationId();
    const isMemberActive = status === 'ACTIVE' && instant_verify;

    // 2. Insert member record
    const { rows: memberRows } = await client.query(
      `INSERT INTO members (user_id, trainer_id, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone, registration_id, status, notes, joining_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
       RETURNING *`,
      [
        userId, trainer_id || null, date_of_birth || null, gender || 'MALE',
        address || null, emergency_contact_name || null, emergency_contact_phone || null,
        registrationId, isMemberActive ? 'ACTIVE' : 'INACTIVE', notes || null
      ]
    );
    const member = memberRows[0];

    // 3. Resolve plan details & price
    let plan = null;
    try {
      const { rows: pRows } = await client.query('SELECT * FROM membership_plans WHERE id = $1', [plan_id]);
      if (pRows && pRows.length > 0) plan = pRows[0];
    } catch (_) {}

    const months = Number(duration_months) || plan?.duration_months || 3;
    const price = amount_paid ? parseFloat(String(amount_paid).replace(/[^0-9.]/g, '')) : (plan?.price || 2699);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // 4. Create membership record
    const { rows: mbRows } = await client.query(
      `INSERT INTO memberships (member_id, plan_id, start_date, end_date, price_paid, payment_status, membership_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        member.id, plan_id || 1, startDate, endDate, price,
        instant_verify ? 'PAID' : 'PENDING',
        isMemberActive ? 'ACTIVE' : 'INACTIVE'
      ]
    );
    const membership = mbRows[0];

    // 5. Create payment record
    const invoiceNumber = generateInvoiceNumber();
    const { rows: pRows } = await client.query(
      `INSERT INTO payments (member_id, membership_id, amount, payment_method, invoice_number, status, payment_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       RETURNING *`,
      [
        member.id, membership.id, price, payment_method.toUpperCase(), invoiceNumber,
        instant_verify ? 'SUCCESS' : 'PENDING',
        proof_note || (utr_number ? `UTR: ${utr_number}` : 'Owner registration payment')
      ]
    );
    const payment = pRows[0];

    // 6. If payment is pending (like UTR or CASH), create payment_request for owner verification queue
    if (!instant_verify) {
      await client.query(
        `INSERT INTO payment_requests (member_id, plan_id, amount, utr_number, proof_note, status, activated_membership_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          member.id, plan_id || 1, price,
          utr_number || (payment_method === 'CASH' ? 'CASH_DUE' : 'PENDING_UTR'),
          proof_note || 'Owner registered - payment pending verification',
          payment_method === 'CASH' ? 'PENDING_CASH' : 'PENDING',
          membership.id
        ]
      );
    }

    return {
      ...member,
      full_name: full_name.trim(),
      phone: cleanPhone,
      email: email || '',
      plan_name: plan?.plan_name || plan_name || 'Membership Plan',
      end_date: endDate.toISOString().split('T')[0],
      payment_status: instant_verify ? 'PAID' : 'PENDING',
      amount_paid: `₹${price}`,
      invoice_number: invoiceNumber,
    };
  });

  logger.info(`New member created: ${result.registration_id} (${result.phone})`);
  return successResponse(res, 'Member created successfully', result, 201);
}

// PUT /api/members/:id
async function updateMember(req, res) {
  const { id } = req.params;
  const {
    full_name, phone, email, date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, trainer_id, status, notes
  } = req.body;

  let whereSql = 'WHERE m.id = $1';
  if (isNaN(Number(id))) whereSql = 'WHERE UPPER(m.registration_id) = UPPER($1)';

  const { rows: memberRows } = await query(`SELECT * FROM members m ${whereSql}`, [id]);
  if (memberRows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  const member = memberRows[0];

  // Update user info
  if (full_name || phone || email) {
    await query(
      `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
       email = COALESCE($3, email), updated_at = NOW() WHERE id = $4`,
      [full_name || null, phone || null, email || null, member.user_id]
    );
  }

  // Update member info
  const { rows } = await query(
    `UPDATE members SET
       trainer_id = COALESCE($1, trainer_id),
       date_of_birth = COALESCE($2, date_of_birth),
       gender = COALESCE($3, gender),
       address = COALESCE($4, address),
       emergency_contact_name = COALESCE($5, emergency_contact_name),
       emergency_contact_phone = COALESCE($6, emergency_contact_phone),
       status = COALESCE($7, status),
       notes = COALESCE($8, notes),
       updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [trainer_id || null, date_of_birth || null, gender || null, address || null, emergency_contact_name || null, emergency_contact_phone || null, status || null, notes || null, member.id]
  );

  return successResponse(res, 'Member updated successfully', rows[0]);
}

// DELETE /api/members/:id (soft delete)
async function deactivateMember(req, res) {
  const { id } = req.params;

  let whereSql = 'WHERE id = $1';
  if (isNaN(Number(id))) whereSql = 'WHERE UPPER(registration_id) = UPPER($1)';

  const { rows } = await query(
    `UPDATE members SET status = 'INACTIVE', updated_at = NOW() ${whereSql} RETURNING id, status`,
    [id]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  return successResponse(res, 'Member deactivated successfully', rows[0]);
}

// GET /api/members/:id/attendance
async function getMemberAttendance(req, res) {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const { offset } = getPagination(page, limit);

  let whereSql = 'WHERE m.id = $1';
  if (isNaN(Number(id))) whereSql = 'WHERE UPPER(m.registration_id) = UPPER($1)';

  const { rows: mem } = await query(`SELECT id FROM members m ${whereSql}`, [id]);
  if (mem.length === 0) return errorResponse(res, 'Member not found.', null, 404);

  const memberId = mem[0].id;
  const { rows } = await query(
    `SELECT * FROM attendance WHERE member_id = $1 ORDER BY date DESC, check_in_time DESC LIMIT $2 OFFSET $3`,
    [memberId, parseInt(limit), offset]
  );

  return successResponse(res, 'Member attendance retrieved', rows);
}

// GET /api/members/:id/payments
async function getMemberPayments(req, res) {
  const { id } = req.params;

  let whereSql = 'WHERE m.id = $1';
  if (isNaN(Number(id))) whereSql = 'WHERE UPPER(m.registration_id) = UPPER($1)';

  const { rows: mem } = await query(`SELECT id FROM members m ${whereSql}`, [id]);
  if (mem.length === 0) return errorResponse(res, 'Member not found.', null, 404);

  const memberId = mem[0].id;
  const { rows } = await query(
    `SELECT p.*, mp.plan_name FROM payments p
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE p.member_id = $1 ORDER BY p.created_at DESC`,
    [memberId]
  );

  return successResponse(res, 'Member payments retrieved', rows);
}

// GET /api/members/me
async function getMyProfile(req, res) {
  const userId = req.user.id;
  const { rows } = await query(
    `SELECT m.*, u.full_name, u.phone, u.email, u.fcm_token
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.user_id = $1`,
    [userId]
  );

  if (rows.length === 0) return errorResponse(res, 'Member profile not found.', null, 404);
  return successResponse(res, 'Profile retrieved', rows[0]);
}

// PUT /api/members/me
async function updateMyProfile(req, res) {
  const userId = req.user.id;
  const { address, emergency_contact_name, emergency_contact_phone, date_of_birth, gender } = req.body;

  const { rows } = await query(
    `UPDATE members SET
       address = COALESCE($1, address),
       emergency_contact_name = COALESCE($2, emergency_contact_name),
       emergency_contact_phone = COALESCE($3, emergency_contact_phone),
       date_of_birth = COALESCE($4, date_of_birth),
       gender = COALESCE($5, gender),
       updated_at = NOW()
     WHERE user_id = $6 RETURNING *`,
    [address, emergency_contact_name, emergency_contact_phone, date_of_birth, gender, userId]
  );

  return successResponse(res, 'Profile updated successfully', rows[0]);
}

// PATCH /api/members/:id/status
async function updateMemberStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['ACTIVE', 'FROZEN', 'EXPIRED', 'INACTIVE'];
  if (!status || !validStatuses.includes(status)) {
    return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  let whereSql = 'WHERE id = $1';
  if (isNaN(Number(id))) whereSql = 'WHERE UPPER(registration_id) = UPPER($1)';

  const { rows: memberRows } = await query(`SELECT * FROM members ${whereSql}`, [id]);
  if (memberRows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  const member = memberRows[0];

  // Update member status
  const { rows } = await query(
    `UPDATE members SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, member.id]
  );

  // Propagate to memberships & user account
  if (status === 'FROZEN') {
    await query(
      `UPDATE memberships SET membership_status = 'FROZEN', is_frozen = 1, frozen_at = NOW(), updated_at = NOW()
       WHERE member_id = $1 AND membership_status = 'ACTIVE'`,
      [member.id]
    );
  } else if (status === 'ACTIVE') {
    await query(
      `UPDATE memberships SET membership_status = 'ACTIVE', is_frozen = 0, unfrozen_at = NOW(), updated_at = NOW()
       WHERE member_id = $1 AND membership_status = 'FROZEN'`,
      [member.id]
    );
    await query(
      `UPDATE users SET status = 'ACTIVE', updated_at = NOW()
       WHERE id = $1`,
      [member.user_id]
    );
  } else if (status === 'INACTIVE') {
    await query(
      `UPDATE users SET status = 'INACTIVE', updated_at = NOW()
       WHERE id = $1`,
      [member.user_id]
    );
  } else if (status === 'EXPIRED') {
    await query(
      `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
       WHERE member_id = $1 AND membership_status IN ('ACTIVE', 'FROZEN')`,
      [member.id]
    );
  }

  logger.info(`Member ${member.id} status changed to ${status} by owner`);
  return successResponse(res, `Member status updated to ${status}`, rows[0]);
}

module.exports = {
  getMembers, getMemberById, createMember, updateMember, deactivateMember,
  getMemberAttendance, getMemberPayments, getMyProfile, updateMyProfile, updateMemberStatus
};
