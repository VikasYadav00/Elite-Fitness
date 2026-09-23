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

// GET /api/members
async function getMembers(req, res) {
  const { page = 1, limit = 10, search, status, trainer_id } = req.query;
  const { offset } = getPagination(page, limit);

  let whereConditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (search) {
    whereConditions.push(`(u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR m.registration_id ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (status) {
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
            mb.payment_status
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN trainers t ON t.id = m.trainer_id
     LEFT JOIN users t_user ON t_user.id = t.user_id
     LEFT JOIN memberships mb ON mb.member_id = m.id AND mb.membership_status = 'ACTIVE'
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, parseInt(limit), offset]
  );

  const total = parseInt(countResult.rows[0].count);

  return res.json({
    success: true,
    message: 'Members retrieved successfully',
    data: rows,
    pagination: formatPagination(total, page, limit),
  });
}

// GET /api/members/:id
async function getMemberById(req, res) {
  const { id } = req.params;

  const { rows } = await query(
    `SELECT m.*, u.full_name, u.phone, u.email, u.status as user_status, u.last_login,
            t.id as trainer_id, t_user.full_name as trainer_name, t.specialization as trainer_specialization,
            t.user_id as trainer_user_id
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN trainers t ON t.id = m.trainer_id
     LEFT JOIN users t_user ON t_user.id = t.user_id
     WHERE m.id = $1`,
    [id]
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
    [id]
  );

  member.current_membership = memberships[0] || null;

  return successResponse(res, 'Member retrieved successfully', member);
}

// POST /api/members
async function createMember(req, res) {
  const {
    full_name, phone, email, password, date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, trainer_id, notes
  } = req.body;

  const result = await withTransaction(async (client) => {
    // Check if user already exists
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
    } else {
      const defaultPassword = password || phone;
      const password_hash = await bcrypt.hash(defaultPassword, 12);

      const { rows: userRows } = await client.query(
        `INSERT INTO users (full_name, phone, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE')
         RETURNING id`,
        [full_name, phone, email || null, password_hash]
      );
      userId = userRows[0].id;
    }

    const registrationId = generateRegistrationId();

    const { rows: memberRows } = await client.query(
      `INSERT INTO members (user_id, trainer_id, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone, registration_id, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $9)
       RETURNING *`,
      [
        userId, trainer_id || null, date_of_birth || null, gender || null,
        address || null, emergency_contact_name || null, emergency_contact_phone || null,
        registrationId, notes || null
      ]
    );

    return memberRows[0];
  });

  logger.info(`New member created: ${result.registration_id}`);
  return successResponse(res, 'Member created successfully', result, 201);
}

// PUT /api/members/:id
async function updateMember(req, res) {
  const { id } = req.params;
  const {
    full_name, phone, email, date_of_birth, gender, address,
    emergency_contact_name, emergency_contact_phone, trainer_id, status, notes
  } = req.body;

  const { rows: memberRows } = await query('SELECT * FROM members WHERE id = $1', [id]);
  if (memberRows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  const member = memberRows[0];

  // Update user info
  await query(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
     email = COALESCE($3, email), updated_at = NOW() WHERE id = $4`,
    [full_name, phone, email, member.user_id]
  );

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
    [trainer_id, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, status, notes, id]
  );

  return successResponse(res, 'Member updated successfully', rows[0]);
}

// DELETE /api/members/:id (soft delete)
async function deactivateMember(req, res) {
  const { id } = req.params;

  const { rows } = await query(
    `UPDATE members SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1 RETURNING id, status`,
    [id]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  await query(
    `UPDATE users SET status = 'INACTIVE', updated_at = NOW()
     WHERE id = (SELECT user_id FROM members WHERE id = $1)`,
    [id]
  );

  return successResponse(res, 'Member deactivated successfully', rows[0]);
}

// GET /api/members/:id/attendance
async function getMemberAttendance(req, res) {
  const { id } = req.params;
  const { month, year, page = 1, limit = 30 } = req.query;
  const { offset } = getPagination(page, limit);

  let whereExtra = '';
  const params = [id];
  let paramIdx = 2;

  if (month && year) {
    whereExtra = `AND EXTRACT(MONTH FROM date) = $${paramIdx} AND EXTRACT(YEAR FROM date) = $${paramIdx + 1}`;
    params.push(month, year);
  }

  const { rows } = await query(
    `SELECT * FROM attendance
     WHERE member_id = $1 ${whereExtra}
     ORDER BY date DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );

  return successResponse(res, 'Attendance records retrieved', rows);
}

// GET /api/members/:id/payments
async function getMemberPayments(req, res) {
  const { id } = req.params;

  const { rows } = await query(
    `SELECT p.*, mp.plan_name FROM payments p
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE p.member_id = $1
     ORDER BY p.created_at DESC`,
    [id]
  );

  return successResponse(res, 'Payment history retrieved', rows);
}

// GET /api/members/me (customer's own profile)
async function getMyProfile(req, res) {
  const userId = req.user.id;

  const { rows } = await query(
    `SELECT m.*, u.full_name, u.phone, u.email, u.status as user_status,
            t_user.full_name as trainer_name, t.specialization, t.user_id as trainer_user_id,
            t_user.phone as trainer_phone
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN trainers t ON t.id = m.trainer_id
     LEFT JOIN users t_user ON t_user.id = t.user_id
     WHERE m.user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'Member profile not found.', null, 404);
  }

  const member = rows[0];

  // Get active membership
  const { rows: memberships } = await query(
    `SELECT mb.*, mp.plan_name, mp.duration_months, mp.description
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE mb.member_id = $1 AND mb.membership_status = 'ACTIVE'
     ORDER BY mb.end_date DESC LIMIT 1`,
    [member.id]
  );

  member.current_membership = memberships[0] || null;

  if (member.current_membership) {
    const today = new Date();
    const endDate = new Date(member.current_membership.end_date);
    member.current_membership.days_remaining = Math.max(
      0,
      Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
    );
  }

  return successResponse(res, 'Profile retrieved successfully', member);
}

// PUT /api/members/me (update own profile)
async function updateMyProfile(req, res) {
  const userId = req.user.id;
  const { full_name, email, address, emergency_contact_name, emergency_contact_phone } = req.body;

  await query(
    `UPDATE users SET full_name = COALESCE($1, full_name), email = COALESCE($2, email), updated_at = NOW()
     WHERE id = $3`,
    [full_name, email, userId]
  );

  const { rows } = await query(
    `UPDATE members SET
       address = COALESCE($1, address),
       emergency_contact_name = COALESCE($2, emergency_contact_name),
       emergency_contact_phone = COALESCE($3, emergency_contact_phone),
       updated_at = NOW()
     WHERE user_id = $4 RETURNING *`,
    [address, emergency_contact_name, emergency_contact_phone, userId]
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

  const { rows: memberRows } = await query('SELECT * FROM members WHERE id = $1', [id]);
  if (memberRows.length === 0) {
    return errorResponse(res, 'Member not found.', null, 404);
  }

  // Update member status
  const { rows } = await query(
    `UPDATE members SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  // Propagate to memberships & user account
  if (status === 'FROZEN') {
    await query(
      `UPDATE memberships SET membership_status = 'FROZEN', is_frozen = true, frozen_at = NOW(), updated_at = NOW()
       WHERE member_id = $1 AND membership_status = 'ACTIVE'`,
      [id]
    );
  } else if (status === 'ACTIVE') {
    // Unfreeze any frozen memberships
    await query(
      `UPDATE memberships SET membership_status = 'ACTIVE', is_frozen = false, unfrozen_at = NOW(), updated_at = NOW()
       WHERE member_id = $1 AND membership_status = 'FROZEN'`,
      [id]
    );
    // Reactivate user account
    await query(
      `UPDATE users SET status = 'ACTIVE', updated_at = NOW()
       WHERE id = (SELECT user_id FROM members WHERE id = $1)`,
      [id]
    );
  } else if (status === 'INACTIVE') {
    await query(
      `UPDATE users SET status = 'INACTIVE', updated_at = NOW()
       WHERE id = (SELECT user_id FROM members WHERE id = $1)`,
      [id]
    );
  } else if (status === 'EXPIRED') {
    await query(
      `UPDATE memberships SET membership_status = 'EXPIRED', updated_at = NOW()
       WHERE member_id = $1 AND membership_status IN ('ACTIVE', 'FROZEN')`,
      [id]
    );
  }

  logger.info(`Member ${id} status changed to ${status} by owner`);
  return successResponse(res, `Member status updated to ${status}`, rows[0]);
}

module.exports = {
  getMembers, getMemberById, createMember, updateMember, deactivateMember,
  getMemberAttendance, getMemberPayments, getMyProfile, updateMyProfile, updateMemberStatus
};
