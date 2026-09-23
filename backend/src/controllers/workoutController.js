// Elite Fitness - Workout & Exercise Controller
const { query } = require('../config/database');
const { successResponse, errorResponse, getPagination } = require('../utils/response');

// ===================== EXERCISES =====================

async function getExercises(req, res) {
  const { category, muscle_group, search, status = 'ACTIVE' } = req.query;
  let conditions = [`status = $1`];
  const params = [status];
  let idx = 2;

  if (category) { conditions.push(`category ILIKE $${idx++}`); params.push(`%${category}%`); }
  if (muscle_group) { conditions.push(`muscle_group ILIKE $${idx++}`); params.push(`%${muscle_group}%`); }
  if (search) { conditions.push(`exercise_name ILIKE $${idx++}`); params.push(`%${search}%`); }

  const { rows } = await query(
    `SELECT * FROM exercises WHERE ${conditions.join(' AND ')} ORDER BY exercise_name`,
    params
  );
  return successResponse(res, 'Exercises retrieved', rows);
}

async function getExerciseById(req, res) {
  const { rows } = await query('SELECT * FROM exercises WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return errorResponse(res, 'Exercise not found.', null, 404);
  return successResponse(res, 'Exercise retrieved', rows[0]);
}

async function createExercise(req, res) {
  const { exercise_name, category, muscle_group, description, instructions, image_url, video_url, difficulty } = req.body;

  const { rows } = await query(
    `INSERT INTO exercises (exercise_name, category, muscle_group, description, instructions, image_url, video_url, difficulty)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [exercise_name, category, muscle_group, description, instructions, image_url, video_url, difficulty || 'BEGINNER']
  );
  return successResponse(res, 'Exercise created', rows[0], 201);
}

async function updateExercise(req, res) {
  const { exercise_name, category, muscle_group, description, instructions, image_url, video_url, difficulty, status } = req.body;

  const { rows } = await query(
    `UPDATE exercises SET
       exercise_name = COALESCE($1, exercise_name), category = COALESCE($2, category),
       muscle_group = COALESCE($3, muscle_group), description = COALESCE($4, description),
       instructions = COALESCE($5, instructions), image_url = COALESCE($6, image_url),
       video_url = COALESCE($7, video_url), difficulty = COALESCE($8, difficulty),
       status = COALESCE($9, status), updated_at = NOW()
     WHERE id = $10 RETURNING *`,
    [exercise_name, category, muscle_group, description, instructions, image_url, video_url, difficulty, status, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Exercise not found.', null, 404);
  return successResponse(res, 'Exercise updated', rows[0]);
}

// ===================== WORKOUT PLANS =====================

async function getWorkoutPlans(req, res) {
  const { rows } = await query(
    `SELECT wp.*, u.full_name as created_by_name,
            COUNT(we.id) as exercise_count
     FROM workout_plans wp
     LEFT JOIN users u ON u.id = wp.created_by
     LEFT JOIN workout_exercises we ON we.workout_plan_id = wp.id
     WHERE wp.status = 'ACTIVE'
     GROUP BY wp.id, u.full_name
     ORDER BY wp.created_at DESC`
  );
  return successResponse(res, 'Workout plans retrieved', rows);
}

async function getWorkoutPlanById(req, res) {
  const { rows } = await query('SELECT * FROM workout_plans WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return errorResponse(res, 'Workout plan not found.', null, 404);

  const plan = rows[0];

  const { rows: exercises } = await query(
    `SELECT we.*, e.exercise_name, e.category, e.muscle_group, e.image_url, e.video_url, e.instructions, e.difficulty
     FROM workout_exercises we
     INNER JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_plan_id = $1
     ORDER BY we.day_of_week, we.order_index`,
    [req.params.id]
  );

  plan.exercises = exercises;
  return successResponse(res, 'Workout plan retrieved', plan);
}

async function createWorkoutPlan(req, res) {
  const { title, description, goal, exercises } = req.body;

  const { rows: planRows } = await query(
    `INSERT INTO workout_plans (title, description, goal, created_by, status)
     VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING *`,
    [title, description, goal, req.user.id]
  );

  const plan = planRows[0];

  if (exercises && exercises.length > 0) {
    for (const ex of exercises) {
      await query(
        `INSERT INTO workout_exercises (workout_plan_id, exercise_id, sets, reps, weight_kg, rest_seconds, day_of_week, order_index, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [plan.id, ex.exercise_id, ex.sets || 3, ex.reps || '10', ex.weight_kg, ex.rest_seconds || 60, ex.day_of_week, ex.order_index || 0, ex.notes]
      );
    }
  }

  return successResponse(res, 'Workout plan created', plan, 201);
}

async function updateWorkoutPlan(req, res) {
  const { title, description, goal, status } = req.body;

  const { rows } = await query(
    `UPDATE workout_plans SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       goal = COALESCE($3, goal), status = COALESCE($4, status), updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [title, description, goal, status, req.params.id]
  );

  if (rows.length === 0) return errorResponse(res, 'Workout plan not found.', null, 404);
  return successResponse(res, 'Workout plan updated', rows[0]);
}

async function assignWorkoutToMember(req, res) {
  const { member_id, workout_plan_id, start_date, end_date } = req.body;

  // Deactivate existing
  await query(
    `UPDATE member_workouts SET status = 'INACTIVE', updated_at = NOW()
     WHERE member_id = $1 AND status = 'ACTIVE'`,
    [member_id]
  );

  const { rows } = await query(
    `INSERT INTO member_workouts (member_id, workout_plan_id, assigned_date, start_date, end_date, status, assigned_by)
     VALUES ($1, $2, CURRENT_DATE, $3, $4, 'ACTIVE', $5)
     RETURNING *`,
    [member_id, workout_plan_id, start_date, end_date, req.user.id]
  );

  return successResponse(res, 'Workout assigned to member', rows[0], 201);
}

async function getMemberWorkout(req, res) {
  const memberId = req.params.memberId;

  const { rows } = await query(
    `SELECT mw.*, wp.title, wp.description, wp.goal
     FROM member_workouts mw
     INNER JOIN workout_plans wp ON wp.id = mw.workout_plan_id
     WHERE mw.member_id = $1 AND mw.status = 'ACTIVE'
     ORDER BY mw.assigned_date DESC LIMIT 1`,
    [memberId]
  );

  if (rows.length === 0) return successResponse(res, 'No workout assigned', null);

  const mw = rows[0];

  const { rows: exercises } = await query(
    `SELECT we.*, e.exercise_name, e.category, e.muscle_group, e.image_url, e.video_url, e.instructions, e.difficulty
     FROM workout_exercises we
     INNER JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_plan_id = $1
     ORDER BY we.day_of_week, we.order_index`,
    [mw.workout_plan_id]
  );

  mw.exercises = exercises;
  return successResponse(res, 'Member workout retrieved', mw);
}

// GET /api/workouts/my - for logged in customer
async function getMyWorkout(req, res) {
  const userId = req.user.id;

  const { rows: memberRows } = await query(
    'SELECT id FROM members WHERE user_id = $1', [userId]
  );

  if (memberRows.length === 0) return errorResponse(res, 'Member not found.', null, 404);

  req.params.memberId = memberRows[0].id;
  return getMemberWorkout(req, res);
}

module.exports = {
  getExercises, getExerciseById, createExercise, updateExercise,
  getWorkoutPlans, getWorkoutPlanById, createWorkoutPlan, updateWorkoutPlan,
  assignWorkoutToMember, getMemberWorkout, getMyWorkout
};
