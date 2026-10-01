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

// GET /api/attendance/roster (Active members with today's attendance status for search & manual check-in)
async function getAttendanceMembers(req, res) {
  const today = req.query.date || new Date().toISOString().split('T')[0];
  const search = req.query.search;

  let whereConditions = [`m.status = 'ACTIVE'`];
  const params = [today];
  let idx = 2;

  if (search && search.trim()) {
    whereConditions.push(`(u.full_name ILIKE $${idx} OR m.registration_id ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search.trim()}%`);
    idx++;
  }

  const { rows } = await query(
    `SELECT m.id as member_id, m.registration_id, m.status as member_status,
            u.full_name, u.phone, u.email,
            mp.plan_name, mb.end_date, mb.payment_status,
            a.id as attendance_id, a.check_in_time, a.method,
            CASE WHEN a.id IS NOT NULL THEN 'PRESENT' ELSE 'NOT_CHECKED_IN' END as today_status
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN memberships mb ON mb.member_id = m.id AND mb.membership_status = 'ACTIVE'
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     LEFT JOIN attendance a ON a.member_id = m.id AND a.date = $1
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY (a.id IS NOT NULL) DESC, u.full_name ASC`,
    params
  );

  return successResponse(res, 'Attendance members roster retrieved', rows);
}

// POST /api/attendance/manual
async function manualAttendance(req, res) {
  const { member_id, date, status = 'PRESENT', notes } = req.body;

  let targetMemberId = member_id;

  // If member_id is a registration_id or phone number, resolve to numeric member_id
  if (!targetMemberId || isNaN(Number(targetMemberId))) {
    const ident = String(member_id || '').trim();
    const cleanP = ident.replace(/\D/g, '').slice(-10);
    const { rows: mFound } = await query(
      `SELECT m.id FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE UPPER(m.registration_id) = UPPER($1) OR u.phone = $1 OR RIGHT(u.phone, 10) = $2 LIMIT 1`,
      [ident, cleanP]
    );
    if (mFound && mFound.length > 0) {
      targetMemberId = mFound[0].id;
    } else {
      return errorResponse(res, `Member with ID or Phone "${ident}" not found.`, null, 404);
    }
  }

  const attDate = date || new Date().toISOString().split('T')[0];

  const { rows } = await query(
    `INSERT INTO attendance (member_id, date, check_in_time, method, status, notes)
     VALUES ($1, $2, NOW(), 'MANUAL', $3, $4)
     ON CONFLICT (member_id, date)
     DO UPDATE SET status = $3, notes = $4, method = 'MANUAL'
     RETURNING *`,
    [targetMemberId, attDate, status, notes || null]
  );

  // Fetch full joined details for the frontend
  const { rows: fullRows } = await query(
    `SELECT a.*, u.full_name, u.phone, m.registration_id
     FROM attendance a
     INNER JOIN members m ON m.id = a.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE a.id = $1`,
    [rows[0].id]
  );

  const returnedItem = fullRows && fullRows.length > 0 ? fullRows[0] : rows[0];
  logger.info(`Manual attendance marked: member_id=${targetMemberId}, status=${status}`);
  return successResponse(res, 'Attendance recorded successfully', returnedItem);
}

// POST /api/attendance/generate-qr (OWNER)
async function generateAttendanceQR(req, res) {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  await query(
    `UPDATE attendance_sessions SET is_active = false WHERE valid_for_date = $1 AND created_by = $2`,
    [today, userId]
  );

  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

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

  const { rows: sessions } = await query(
    `SELECT * FROM attendance_sessions
     WHERE session_token = $1 AND is_active = true AND expires_at > NOW() AND valid_for_date = CURRENT_DATE`,
    [session_token]
  );

  if (sessions.length === 0) {
    return errorResponse(res, 'Invalid or expired QR. Ask the gym owner to regenerate.', null, 400);
  }

  const { rows: memberRows } = await query(
    `SELECT id FROM members WHERE user_id = $1`,
    [userId]
  );

  if (memberRows.length === 0) {
    return errorResponse(res, 'Member profile not found.', null, 404);
  }

  const member_id = memberRows[0].id;
  const today = new Date().toISOString().split('T')[0];

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

  const { rows: existing } = await query(
    `SELECT id FROM attendance WHERE member_id = $1 AND date = $2`,
    [member_id, today]
  );

  if (existing.length > 0) {
    return errorResponse(res, 'You have already checked in today.', null, 409);
  }

  const { rows: mbRows } = await query(
    `SELECT id FROM memberships
     WHERE member_id = $1 AND membership_status = 'ACTIVE' AND end_date >= CURRENT_DATE LIMIT 1`,
    [member_id]
  );

  if (mbRows.length === 0) {
    return errorResponse(res, 'No active membership. Please renew to check in.', null, 403);
  }

  const { rows } = await query(
    `INSERT INTO attendance (member_id, date, check_in_time, method, status, device_fingerprint, session_token)
     VALUES ($1, $2, NOW(), 'QR', 'PRESENT', $3, $4)
     RETURNING *`,
    [member_id, today, device_fingerprint, session_token]
  );

  logger.info(`QR Session check-in: member_id=${member_id}, device=${device_fingerprint.slice(0, 8)}...`);
  return successResponse(res, 'Check-in successful! Welcome to Elite Fitness! 💪', rows[0], 201);
}

// POST /api/attendance/public-checkin (Public Table QR Scan)
async function publicTableCheckIn(req, res) {
  const { registration_id, phone, method = 'QR_TABLE_SCAN', device_fingerprint } = req.body;

  if (!registration_id && !phone) {
    return errorResponse(res, 'Registration ID or phone number is required.', null, 400);
  }

  const queryIdentifier = (registration_id || phone).trim();
  const cleanPhone = queryIdentifier.replace(/\D/g, '').slice(-10);
  const today = new Date().toISOString().split('T')[0];

  try {
    const { rows: memberRows } = await query(
      `SELECT m.id, m.registration_id, m.status, u.full_name, u.phone
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE UPPER(m.registration_id) = UPPER($1) OR u.phone = $1 OR RIGHT(u.phone, 10) = $2`,
      [queryIdentifier, cleanPhone]
    );

    if (memberRows && memberRows.length > 0) {
      const member = memberRows[0];

      if (member.status !== 'ACTIVE') {
        return errorResponse(res, '🚫 ACCESS DENIED: Membership is INACTIVE or payment is pending at reception. Please pay at the front desk to activate your pass.', null, 403);
      }

      // Check active membership with confirmed payment
      const { rows: mbRows } = await query(
        `SELECT id, payment_status FROM memberships
         WHERE member_id = $1 AND membership_status = 'ACTIVE' AND end_date >= CURRENT_DATE LIMIT 1`,
        [member.id]
      );

      if (mbRows.length === 0) {
        return errorResponse(res, '🚫 ACCESS DENIED: Membership has expired or is not active. Please renew at the front desk.', null, 403);
      }

      // Check if payment is pending (for cash or unverified UTR)
      const currentMb = mbRows[0];
      if (currentMb.payment_status === 'PENDING' || currentMb.payment_status === 'DUE') {
        return errorResponse(res, '🚫 ACCESS DENIED: Payment is pending verification at the gym reception desk. Please show your receipt/pass to activate entry.', null, 403);
      }

      // Check if already checked in today
      const { rows: existing } = await query(
        `SELECT id, check_in_time FROM attendance WHERE member_id = $1 AND date = $2`,
        [member.id, today]
      );

      if (existing.length > 0) {
        return successResponse(res, `Welcome back, ${member.full_name}! Already checked in today.`, existing[0]);
      }

      // Record attendance
      const { rows: newAtt } = await query(
        `INSERT INTO attendance (member_id, date, check_in_time, method, status, notes)
         VALUES ($1, $2, NOW(), $3, 'PRESENT', $4) RETURNING *`,
        [member.id, today, method, `Table Scan: ${device_fingerprint || 'Mobile'}`]
      );

      return successResponse(res, `Check-in successful! Welcome to Elite Fitness, ${member.full_name}! 💪`, {
        ...newAtt[0],
        member_name: member.full_name,
        registration_id: member.registration_id
      }, 201);
    } else {
      return errorResponse(res, '🚫 ACCESS DENIED: Member not found or unverified. Please register and complete payment at the front desk.', null, 403);
    }
  } catch (err) {
    logger.warn('DB publicTableCheckIn note:', err.message);
    return errorResponse(res, '🚫 Attendance verification failed. Please show your pass to the front desk.', null, 403);
  }
}

// Ingest cloud sync attendance into database
async function ingestCloudAttendance(data) {
  if (!data) return;
  const regId = (data.reg_id || '').trim();
  const date = data.date || new Date().toISOString().split('T')[0];
  if (!regId) return;

  try {
    const cleanPhone = regId.replace(/\D/g, '').slice(-10);
    await query(
      `INSERT INTO attendance (member_id, date, check_in_time, method, status, notes)
       SELECT m.id, $1, NOW(), $2, 'PRESENT', $3
       FROM members m
       INNER JOIN users u ON u.id = m.user_id
       WHERE (UPPER(m.registration_id) = UPPER($4) OR RIGHT(u.phone, 10) = $5) AND m.status = 'ACTIVE'
       ON CONFLICT (member_id, date) DO NOTHING`,
      [date, data.method || 'QR_TABLE_SCAN', 'Cloud Table QR scan', regId, cleanPhone]
    );
  } catch (_) {}
}

module.exports = {
  checkIn, checkOut, qrCheckIn, getAttendance, getTodayAttendance, getAttendanceMembers,
  manualAttendance, generateAttendanceQR, qrSessionCheckIn, publicTableCheckIn,
  ingestCloudAttendance
};
