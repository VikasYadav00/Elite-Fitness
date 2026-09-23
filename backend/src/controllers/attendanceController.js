// Elite Fitness - Attendance Controller
const { query } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');


// POST /api/attendance/check-in
async function checkIn(req, res) {
  const { member_id, method = 'MANUAL', notes } = req.body;

  // Verify member has active membership for QR check-in
  const { rows: mbRows } = await query(
    `SELECT mb.id, mb.end_date FROM memberships mb
     WHERE mb.member_id = $1 AND mb.membership_status = 'ACTIVE'
     AND mb.end_date >= CURRENT_DATE LIMIT 1`,
    [member_id]
  );

  if (mbRows.length === 0) {
    return errorResponse(res, 'No active membership. Please renew your membership to check in.', null, 403);
  }

  const today = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const { rows: existing } = await query(
    'SELECT id, check_in_time, check_out_time FROM attendance WHERE member_id = $1 AND date = $2',
    [member_id, today]
  );

  if (existing.length > 0) {
    const record = existing[0];
    if (record.check_in_time && !record.check_out_time) {
      return successResponse(res, 'Already checked in today. Please check out first.', record);
    }
    return successResponse(res, 'Already attended today.', record);
  }

  const { rows } = await query(
    `INSERT INTO attendance (member_id, date, check_in_time, method, status, notes)
     VALUES ($1, $2, NOW(), $3, 'PRESENT', $4)
     RETURNING *`,
    [member_id, today, method, notes || null]
  );

  logger.info(`Check-in: member_id=${member_id}, method=${method}`);
  return successResponse(res, 'Check-in successful! Welcome to Elite Fitness!', rows[0], 201);
}

// POST /api/attendance/check-out
async function checkOut(req, res) {
  const { member_id } = req.body;
  const today = new Date().toISOString().split('T')[0];

  const { rows } = await query(
    `UPDATE attendance SET check_out_time = NOW()
     WHERE member_id = $1 AND date = $2 AND check_out_time IS NULL
     RETURNING *`,
    [member_id, today]
  );

  if (rows.length === 0) {
    return errorResponse(res, 'No check-in found for today, or already checked out.', null, 404);
  }

  return successResponse(res, 'Check-out successful. See you tomorrow!', rows[0]);
}

// QR attendance for logged-in customer
// POST /api/attendance/qr-check-in
async function qrCheckIn(req, res) {
  const userId = req.user.id;

  const { rows: memberRows } = await query(
    'SELECT id FROM members WHERE user_id = $1 AND status = $2',
    [userId, 'ACTIVE']
  );

  if (memberRows.length === 0) {
    return errorResponse(res, 'Member profile not found or inactive.', null, 404);
  }

  const member_id = memberRows[0].id;

  // Use checkIn logic
  req.body.member_id = member_id;
  req.body.method = 'QR';
  return checkIn(req, res);
}

// GET /api/attendance
async function getAttendance(req, res) {
  const { page = 1, limit = 20, member_id, date, month, year } = req.query;
  const { offset } = getPagination(page, limit);

  let conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (member_id) { conditions.push(`a.member_id = $${idx++}`); params.push(member_id); }
  if (date) { conditions.push(`a.date = $${idx++}`); params.push(date); }
  if (month) { conditions.push(`EXTRACT(MONTH FROM a.date) = $${idx++}`); params.push(month); }
  if (year) { conditions.push(`EXTRACT(YEAR FROM a.date) = $${idx++}`); params.push(year); }

  const countResult = await query(
    `SELECT COUNT(*) FROM attendance a WHERE ${conditions.join(' AND ')}`, params
  );

  const { rows } = await query(
    `SELECT a.*, u.full_name, u.phone, m.registration_id
     FROM attendance a
     INNER JOIN members m ON m.id = a.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.date DESC, a.check_in_time DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true,
    message: 'Attendance records retrieved',
    data: rows,
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit),
  });
}

// GET /api/attendance/today
async function getTodayAttendance(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const { rows } = await query(
    `SELECT a.*, u.full_name, u.phone, m.registration_id
     FROM attendance a
     INNER JOIN members m ON m.id = a.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE a.date = $1
     ORDER BY a.check_in_time DESC`,
    [today]
  );

  return successResponse(res, "Today's attendance retrieved", {
    date: today,
    total: rows.length,
    records: rows,
  });
}

// POST /api/attendance/manual
async function manualAttendance(req, res) {
  const { member_id, date, status = 'PRESENT', notes } = req.body;

  const { rows } = await query(
    `INSERT INTO attendance (member_id, date, check_in_time, method, status, notes)
     VALUES ($1, $2, NOW(), 'MANUAL', $3, $4)
     ON CONFLICT (member_id, date)
     DO UPDATE SET status = $3, notes = $4, method = 'MANUAL'
     RETURNING *`,
    [member_id, date, status, notes || null]
  );

  return successResponse(res, 'Attendance recorded', rows[0]);
}

// POST /api/attendance/generate-qr (OWNER)
async function generateAttendanceQR(req, res) {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Deactivate previous sessions for today from this owner
  await query(
    `UPDATE attendance_sessions SET is_active = false WHERE valid_for_date = $1 AND created_by = $2`,
    [today, userId]
  );

  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

  const { rows } = await query(
    `INSERT INTO attendance_sessions (session_token, created_by, valid_for_date, expires_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [sessionToken, userId, today, expiresAt]
  );

  logger.info(`Attendance QR session generated by user ${userId} for ${today}`);
  return successResponse(res, 'Attendance QR session created', {
    session_token: sessionToken,
    valid_for_date: today,
    expires_at: expiresAt.toISOString(),
    session_id: rows[0].id,
  });
}

// POST /api/attendance/session-checkin (CUSTOMER — authenticated)
async function qrSessionCheckIn(req, res) {
  const userId = req.user.id;
  const { session_token, device_fingerprint } = req.body;

  if (!session_token || !device_fingerprint) {
    return errorResponse(res, 'session_token and device_fingerprint are required.');
  }

  // Validate session is active & not expired & for today
  const { rows: sessions } = await query(
    `SELECT * FROM attendance_sessions
     WHERE session_token = $1 AND is_active = true AND expires_at > NOW() AND valid_for_date = CURRENT_DATE`,
    [session_token]
  );

  if (sessions.length === 0) {
    return errorResponse(res, 'Invalid or expired QR. Ask the gym owner to regenerate.', null, 400);
  }

  // Get member profile
  const { rows: memberRows } = await query(
    `SELECT id FROM members WHERE user_id = $1`,
    [userId]
  );

  if (memberRows.length === 0) {
    return errorResponse(res, 'Member profile not found.', null, 404);
  }

  const member_id = memberRows[0].id;
  const today = new Date().toISOString().split('T')[0];

  // Device-lock: one device → one check-in per day (across all members)
  const { rows: deviceCheck } = await query(
    `SELECT id FROM attendance WHERE date = $1 AND device_fingerprint = $2`,
    [today, device_fingerprint]
  );

  if (deviceCheck.length > 0) {
    return errorResponse(
      res,
      'Attendance already marked from this device today. Each device can only check in once per day.',
      null,
      409
    );
  }

  // Member already checked in today?
  const { rows: existing } = await query(
    `SELECT id FROM attendance WHERE member_id = $1 AND date = $2`,
    [member_id, today]
  );

  if (existing.length > 0) {
    return errorResponse(res, 'You have already checked in today.', null, 409);
  }

  // Verify active membership
  const { rows: mbRows } = await query(
    `SELECT id FROM memberships
     WHERE member_id = $1 AND membership_status = 'ACTIVE' AND end_date >= CURRENT_DATE LIMIT 1`,
    [member_id]
  );

  if (mbRows.length === 0) {
    return errorResponse(res, 'No active membership. Please renew to check in.', null, 403);
  }

  // Mark attendance with device fingerprint stored
  const { rows } = await query(
    `INSERT INTO attendance (member_id, date, check_in_time, method, status, device_fingerprint, session_token)
     VALUES ($1, $2, NOW(), 'QR', 'PRESENT', $3, $4)
     RETURNING *`,
    [member_id, today, device_fingerprint, session_token]
  );

  logger.info(`QR Session check-in: member_id=${member_id}, device=${device_fingerprint.slice(0, 8)}...`);
  return successResponse(res, 'Check-in successful! Welcome to Elite Fitness! 💪', rows[0], 201);
}

module.exports = {
  checkIn, checkOut, qrCheckIn, getAttendance, getTodayAttendance,
  manualAttendance, generateAttendanceQR, qrSessionCheckIn,
};
