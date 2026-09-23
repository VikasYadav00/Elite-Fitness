// Elite Fitness - Diet Controller
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

// =================== DIET PLANS ===================

async function getDietPlans(req, res) {
  const { rows } = await query(
    `SELECT dp.*, u.full_name as created_by_name,
            COUNT(dm.id) as meal_count
     FROM diet_plans dp
     LEFT JOIN users u ON u.id = dp.created_by
     LEFT JOIN diet_meals dm ON dm.diet_plan_id = dp.id
     WHERE dp.status = 'ACTIVE'
     GROUP BY dp.id, u.full_name
     ORDER BY dp.created_at DESC`
  );
  return successResponse(res, 'Diet plans retrieved', rows);
}

async function getDietPlanById(req, res) {
  const { rows } = await query('SELECT * FROM diet_plans WHERE id = $1', [req.params.id]);
  if (rows.length === 0) return errorResponse(res, 'Diet plan not found.', null, 404);

  const plan = rows[0];

  const { rows: meals } = await query(
    `SELECT * FROM diet_meals WHERE diet_plan_id = $1 ORDER BY order_index`,
    [req.params.id]
  );

  plan.meals = meals;
  return successResponse(res, 'Diet plan retrieved', plan);
}

async function createDietPlan(req, res) {
  const { title, description, goal, total_calories, meals } = req.body;

  const { rows: planRows } = await query(
    `INSERT INTO diet_plans (title, description, goal, total_calories, created_by, status)
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING *`,
    [title, description, goal, total_calories, req.user.id]
  );

  const plan = planRows[0];

  if (meals && meals.length > 0) {
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      await query(
        `INSERT INTO diet_meals (diet_plan_id, meal_type, meal_name, meal_time, food_items, calories, protein_g, carbs_g, fat_g, notes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [plan.id, meal.meal_type, meal.meal_name, meal.meal_time, meal.food_items, meal.calories || 0, meal.protein_g || 0, meal.carbs_g || 0, meal.fat_g || 0, meal.notes, i]
      );
    }
  }

  return successResponse(res, 'Diet plan created', plan, 201);
}

async function updateDietPlan(req, res) {
  const { title, description, goal, total_calories, status } = req.body;

  const { rows } = await query(
    `UPDATE diet_plans SET
       title = COALESCE($1, title), description = COALESCE($2, description),
       goal = COALESCE($3, goal), total_calories = COALESCE($4, total_calories),
       status = COALESCE($5, status), updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [title, description, goal, total_calories, status, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Diet plan not found.', null, 404);
  return successResponse(res, 'Diet plan updated', rows[0]);
}

async function assignDietToMember(req, res) {
  const { member_id, diet_plan_id, start_date, end_date } = req.body;

  // Deactivate existing diet
  await query(
    `UPDATE member_diets SET status = 'INACTIVE', updated_at = NOW()
     WHERE member_id = $1 AND status = 'ACTIVE'`,
    [member_id]
  );

  const { rows } = await query(
    `INSERT INTO member_diets (member_id, diet_plan_id, start_date, end_date, status, assigned_by)
     VALUES ($1, $2, $3, $4, 'ACTIVE', $5) RETURNING *`,
    [member_id, diet_plan_id, start_date, end_date, req.user.id]
  );

  return successResponse(res, 'Diet plan assigned to member', rows[0], 201);
}

async function getMemberDiet(req, res) {
  const { memberId } = req.params;

  const { rows } = await query(
    `SELECT md.*, dp.title, dp.description, dp.goal, dp.total_calories
     FROM member_diets md
     INNER JOIN diet_plans dp ON dp.id = md.diet_plan_id
     WHERE md.member_id = $1 AND md.status = 'ACTIVE'
     ORDER BY md.created_at DESC LIMIT 1`,
    [memberId]
  );

  if (rows.length === 0) return successResponse(res, 'No diet plan assigned', null);

  const memberDiet = rows[0];

  const { rows: meals } = await query(
    `SELECT * FROM diet_meals WHERE diet_plan_id = $1 ORDER BY order_index`,
    [memberDiet.diet_plan_id]
  );

  memberDiet.meals = meals;
  return successResponse(res, 'Member diet retrieved', memberDiet);
}

async function getMyDiet(req, res) {
  const userId = req.user.id;

  const { rows: memberRows } = await query(
    'SELECT id FROM members WHERE user_id = $1', [userId]
  );

  if (memberRows.length === 0) return errorResponse(res, 'Member not found.', null, 404);

  req.params.memberId = memberRows[0].id;
  return getMemberDiet(req, res);
}

module.exports = {
  getDietPlans, getDietPlanById, createDietPlan, updateDietPlan,
  assignDietToMember, getMemberDiet, getMyDiet
};
