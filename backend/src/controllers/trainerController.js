// Elite Fitness - Trainer Controller
const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');
const logger = require('../utils/logger');

// GET /api/trainers
async function getTrainers(req, res) {
  const { page = 1, limit = 10, status = 'ACTIVE' } = req.query;
  const { offset } = getPagination(page, limit);

  const { rows } = await query(
    `SELECT t.*, u.full_name, u.phone, u.email,
            COUNT(m.id) as assigned_members
     FROM trainers t
     INNER JOIN users u ON u.id = t.user_id
     LEFT JOIN members m ON m.trainer_id = t.id AND m.status = 'ACTIVE'
     WHERE t.status = $1
     GROUP BY t.id, u.full_name, u.phone, u.email
     ORDER BY u.full_name ASC
     LIMIT $2 OFFSET $3`,
    [status, parseInt(limit), offset]
  );

  return successResponse(res, 'Trainers retrieved', rows);
}

// GET /api/trainers/:id
async function getTrainerById(req, res) {
  const { rows } = await query(
    `SELECT t.*, u.full_name, u.phone, u.email
     FROM trainers t
     INNER JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Trainer not found.', null, 404);

  const trainer = rows[0];

  // Get assigned members
  const { rows: members } = await query(
    `SELECT m.id, m.registration_id, m.status, u.full_name, u.phone
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     WHERE m.trainer_id = $1 AND m.status = 'ACTIVE'
     ORDER BY u.full_name`,
    [req.params.id]
  );

  trainer.assigned_members = members;
  return successResponse(res, 'Trainer retrieved', trainer);
}

// POST /api/trainers
async function createTrainer(req, res) {
  const { full_name, phone, email, password, specialization, experience_years, bio } = req.body;

  const result = await withTransaction(async (client) => {
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE phone = $1', [phone]
    );

    let userId;
    if (existing.length > 0) {
      userId = existing[0].id;
      await client.query(
        `UPDATE users SET role = 'TRAINER', updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    } else {
      const password_hash = await bcrypt.hash(password || phone, 12);
      const { rows: userRows } = await client.query(
        `INSERT INTO users (full_name, phone, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, 'TRAINER', 'ACTIVE')
         RETURNING id`,
        [full_name, phone, email || null, password_hash]
      );
      userId = userRows[0].id;
    }

    const { rows: trainerRows } = await client.query(
      `INSERT INTO trainers (user_id, specialization, experience_years, bio, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       RETURNING *`,
      [userId, specialization || null, experience_years || 0, bio || null]
    );

    return trainerRows[0];
  });

  return successResponse(res, 'Trainer created successfully', result, 201);
}

// PUT /api/trainers/:id
async function updateTrainer(req, res) {
  const { full_name, phone, email, specialization, experience_years, bio, status } = req.body;

  const { rows: trainerRows } = await query('SELECT * FROM trainers WHERE id = $1', [req.params.id]);
  if (trainerRows.length === 0) return errorResponse(res, 'Trainer not found.', null, 404);

  const trainer = trainerRows[0];

  await query(
    `UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone),
     email = COALESCE($3, email), updated_at = NOW() WHERE id = $4`,
    [full_name, phone, email, trainer.user_id]
  );

  const { rows } = await query(
    `UPDATE trainers SET specialization = COALESCE($1, specialization),
       experience_years = COALESCE($2, experience_years), bio = COALESCE($3, bio),
       status = COALESCE($4, status), updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [specialization, experience_years, bio, status, req.params.id]
  );

  return successResponse(res, 'Trainer updated', rows[0]);
}

// DELETE /api/trainers/:id (soft delete)
async function deactivateTrainer(req, res) {
  const { rows } = await query(
    `UPDATE trainers SET status = 'INACTIVE', updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Trainer not found.', null, 404);
  return successResponse(res, 'Trainer deactivated');
}

module.exports = { getTrainers, getTrainerById, createTrainer, updateTrainer, deactivateTrainer };
