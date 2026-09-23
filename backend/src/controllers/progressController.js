// Elite Fitness - Progress Controller
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

async function getMemberProgress(req, res) {
  const { memberId } = req.params;
  const { limit = 10 } = req.query;

  const { rows } = await query(
    `SELECT * FROM progress WHERE member_id = $1
     ORDER BY recorded_date DESC LIMIT $2`,
    [memberId, parseInt(limit)]
  );

  // Get progress photos
  const { rows: photos } = await query(
    `SELECT * FROM progress_photos WHERE member_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [memberId]
  );

  return successResponse(res, 'Progress retrieved', { records: rows, photos });
}

async function getMyProgress(req, res) {
  const userId = req.user.id;
  const { rows: memberRows } = await query('SELECT id FROM members WHERE user_id = $1', [userId]);
  if (memberRows.length === 0) return errorResponse(res, 'Member not found.', null, 404);
  req.params.memberId = memberRows[0].id;
  return getMemberProgress(req, res);
}

async function addProgressRecord(req, res) {
  const { member_id, recorded_date, weight_kg, height_cm, body_fat_percent, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, calves_cm, notes } = req.body;

  // Calculate BMI
  let bmi = null;
  if (weight_kg && height_cm) {
    const heightM = height_cm / 100;
    bmi = parseFloat((weight_kg / (heightM * heightM)).toFixed(2));
  }

  const { rows } = await query(
    `INSERT INTO progress (member_id, recorded_date, weight_kg, height_cm, bmi, body_fat_percent,
       chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, calves_cm, notes, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [member_id, recorded_date || new Date(), weight_kg, height_cm, bmi, body_fat_percent,
     chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, calves_cm, notes, req.user.id]
  );

  return successResponse(res, 'Progress recorded', rows[0], 201);
}

async function addProgressPhoto(req, res) {
  const { member_id, photo_url, photo_type, progress_id, notes } = req.body;

  const { rows } = await query(
    `INSERT INTO progress_photos (member_id, progress_id, photo_url, photo_type, photo_date, notes)
     VALUES ($1, $2, $3, $4, CURRENT_DATE, $5) RETURNING *`,
    [member_id, progress_id, photo_url, photo_type || 'FRONT', notes]
  );

  return successResponse(res, 'Progress photo added', rows[0], 201);
}

module.exports = { getMemberProgress, getMyProgress, addProgressRecord, addProgressPhoto };
