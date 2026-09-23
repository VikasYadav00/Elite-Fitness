// Elite Fitness - Notifications, Offers & Announcements Controller
const { query } = require('../config/database');
const { sendNotificationToAllMembers, sendNotificationToUser } = require('../services/fcmService');
const { successResponse, errorResponse } = require('../utils/response');

// ===================== NOTIFICATIONS =====================

async function getMyNotifications(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  const { rows } = await query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, parseInt(limit), offset]
  );

  const { rows: countRows } = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [req.user.id]
  );

  return successResponse(res, 'Notifications retrieved', {
    notifications: rows,
    unreadCount: parseInt(countRows[0].count),
  });
}

async function markNotificationRead(req, res) {
  const { id } = req.params;
  if (id === 'all') {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    return successResponse(res, 'All notifications marked as read');
  }

  await query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  return successResponse(res, 'Notification marked as read');
}

// POST /api/notifications/broadcast (Owner only)
async function broadcastNotification(req, res) {
  const { title, body, type = 'ANNOUNCEMENT' } = req.body;
  await sendNotificationToAllMembers(title, body, type);
  return successResponse(res, 'Notification broadcast to all members');
}

// ===================== OFFERS =====================

async function getOffers(req, res) {
  const { status, active_only } = req.query;

  let whereClause = '';
  if (active_only === 'true') {
    whereClause = `WHERE status = 'ACTIVE' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`;
  } else if (status) {
    whereClause = `WHERE status = $1`;
  }

  const { rows } = await query(
    `SELECT * FROM offers ${whereClause} ORDER BY created_at DESC`,
    status && !active_only ? [status] : []
  );
  return successResponse(res, 'Offers retrieved', rows);
}

async function createOffer(req, res) {
  const { title, description, discount_percent, discount_amount, applicable_plans, start_date, end_date, image_url } = req.body;

  const { rows } = await query(
    `INSERT INTO offers (title, description, discount_percent, discount_amount, applicable_plans, start_date, end_date, status, image_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', $8, $9) RETURNING *`,
    [title, description, discount_percent, discount_amount, JSON.stringify(applicable_plans || []), start_date, end_date, image_url, req.user.id]
  );

  // Notify all members about the offer
  try {
    await sendNotificationToAllMembers(
      `🎉 Special Offer: ${title}`,
      description || 'Check out this exclusive offer at Elite Fitness!',
      'OFFER',
      { offerId: String(rows[0].id) }
    );
  } catch (e) { /* non-blocking */ }

  return successResponse(res, 'Offer created', rows[0], 201);
}

async function updateOffer(req, res) {
  const { title, description, discount_percent, discount_amount, start_date, end_date, status, image_url } = req.body;

  const { rows } = await query(
    `UPDATE offers SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       discount_percent = COALESCE($3, discount_percent), discount_amount = COALESCE($4, discount_amount),
       start_date = COALESCE($5, start_date), end_date = COALESCE($6, end_date),
       status = COALESCE($7, status), image_url = COALESCE($8, image_url), updated_at = NOW()
     WHERE id = $9 RETURNING *`,
    [title, description, discount_percent, discount_amount, start_date, end_date, status, image_url, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Offer not found.', null, 404);
  return successResponse(res, 'Offer updated', rows[0]);
}

// ===================== ANNOUNCEMENTS =====================

async function getAnnouncements(req, res) {
  const { rows } = await query(
    `SELECT * FROM announcements WHERE status = 'ACTIVE'
     ORDER BY is_pinned DESC, created_at DESC LIMIT 20`
  );
  return successResponse(res, 'Announcements retrieved', rows);
}

async function createAnnouncement(req, res) {
  const { title, body, target_audience = 'ALL', is_pinned = false } = req.body;

  const { rows } = await query(
    `INSERT INTO announcements (title, body, target_audience, is_pinned, status, created_by)
     VALUES ($1, $2, $3, $4, 'ACTIVE', $5) RETURNING *`,
    [title, body, target_audience, is_pinned, req.user.id]
  );

  // Broadcast notification
  try {
    await sendNotificationToAllMembers(
      `📢 ${title}`,
      body,
      'ANNOUNCEMENT',
      { announcementId: String(rows[0].id) }
    );
  } catch (e) { /* non-blocking */ }

  return successResponse(res, 'Announcement created and sent', rows[0], 201);
}

async function updateAnnouncement(req, res) {
  const { title, body, target_audience, is_pinned, status } = req.body;

  const { rows } = await query(
    `UPDATE announcements SET
       title = COALESCE($1, title), body = COALESCE($2, body),
       target_audience = COALESCE($3, target_audience), is_pinned = COALESCE($4, is_pinned),
       status = COALESCE($5, status), updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [title, body, target_audience, is_pinned, status, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Announcement not found.', null, 404);
  return successResponse(res, 'Announcement updated', rows[0]);
}

module.exports = {
  getMyNotifications, markNotificationRead, broadcastNotification,
  getOffers, createOffer, updateOffer,
  getAnnouncements, createAnnouncement, updateAnnouncement
};
