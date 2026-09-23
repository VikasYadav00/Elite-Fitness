// Elite Fitness - Lead Controller
const { query, withTransaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const bcrypt = require('bcryptjs');

async function getLeads(req, res) {
  const { page = 1, limit = 10, status } = req.query;
  const { offset } = getPagination(page, limit);

  let whereClause = status ? 'WHERE l.status = $1' : '';
  const params = status ? [status] : [];

  const countResult = await query(`SELECT COUNT(*) FROM leads l ${whereClause}`, params);

  const { rows } = await query(
    `SELECT l.*, mp.plan_name as interested_plan_name
     FROM leads l
     LEFT JOIN membership_plans mp ON mp.id = l.interested_plan_id
     ${whereClause}
     ORDER BY l.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true, message: 'Leads retrieved', data: rows,
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit)
  });
}

async function getLeadById(req, res) {
  const { rows } = await query(
    `SELECT l.*, mp.plan_name FROM leads l
     LEFT JOIN membership_plans mp ON mp.id = l.interested_plan_id
     WHERE l.id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Lead not found.', null, 404);
  return successResponse(res, 'Lead retrieved', rows[0]);
}

async function createLead(req, res) {
  const { name, phone, email, interested_plan_id, follow_up_date, notes } = req.body;

  const { rows } = await query(
    `INSERT INTO leads (name, phone, email, interested_plan_id, follow_up_date, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'NEW') RETURNING *`,
    [name, phone, email, interested_plan_id, follow_up_date, notes]
  );
  return successResponse(res, 'Lead created', rows[0], 201);
}

async function updateLead(req, res) {
  const { name, phone, email, interested_plan_id, follow_up_date, notes, status } = req.body;

  const { rows } = await query(
    `UPDATE leads SET
       name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email),
       interested_plan_id = COALESCE($4, interested_plan_id),
       follow_up_date = COALESCE($5, follow_up_date),
       notes = COALESCE($6, notes), status = COALESCE($7, status), updated_at = NOW()
     WHERE id = $8 RETURNING *`,
    [name, phone, email, interested_plan_id, follow_up_date, notes, status, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Lead not found.', null, 404);
  return successResponse(res, 'Lead updated', rows[0]);
}

// POST /api/leads/:id/convert - Convert lead to member
async function convertLeadToMember(req, res) {
  const { id } = req.params;
  const { plan_id, start_date, password } = req.body;

  const { rows: leadRows } = await query('SELECT * FROM leads WHERE id = $1', [id]);
  if (leadRows.length === 0) return errorResponse(res, 'Lead not found.', null, 404);

  const lead = leadRows[0];

  if (lead.status === 'JOINED') {
    return errorResponse(res, 'Lead has already been converted.', null, 409);
  }

  const result = await withTransaction(async (client) => {
    // Check if user exists
    const { rows: existingUser } = await client.query('SELECT id FROM users WHERE phone = $1', [lead.phone]);

    let userId;
    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      const password_hash = await bcrypt.hash(password || lead.phone, 12);
      const { rows: userRows } = await client.query(
        `INSERT INTO users (full_name, phone, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'CUSTOMER', 'ACTIVE') RETURNING id`,
        [lead.name, lead.phone, lead.email, password_hash]
      );
      userId = userRows[0].id;
    }

    const regId = `EF${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.floor(Math.random() * 9000) + 1000}`;

    const { rows: memberRows } = await client.query(
      `INSERT INTO members (user_id, registration_id, status)
       VALUES ($1, $2, 'ACTIVE') RETURNING *`,
      [userId, regId]
    );
    const member = memberRows[0];

    // Mark lead as converted
    await client.query(
      `UPDATE leads SET status = 'JOINED', converted_member_id = $1, updated_at = NOW() WHERE id = $2`,
      [member.id, id]
    );

    return { member, regId };
  });

  return successResponse(res, 'Lead converted to member successfully', result, 201);
}

module.exports = { getLeads, getLeadById, createLead, updateLead, convertLeadToMember };
