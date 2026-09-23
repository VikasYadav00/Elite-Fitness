// Elite Fitness - Expense Controller
const { query } = require('../config/database');
const { successResponse, errorResponse, getPagination, formatPagination } = require('../utils/response');

async function getExpenses(req, res) {
  const { page = 1, limit = 10, category, from_date, to_date, month, year } = req.query;
  const { offset } = getPagination(page, limit);

  let conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (category) { conditions.push(`category = $${idx++}`); params.push(category); }
  if (from_date) { conditions.push(`expense_date >= $${idx++}`); params.push(from_date); }
  if (to_date) { conditions.push(`expense_date <= $${idx++}`); params.push(to_date); }
  if (month) { conditions.push(`EXTRACT(MONTH FROM expense_date) = $${idx++}`); params.push(month); }
  if (year) { conditions.push(`EXTRACT(YEAR FROM expense_date) = $${idx++}`); params.push(year); }

  const countResult = await query(`SELECT COUNT(*) FROM expenses WHERE ${conditions.join(' AND ')}`, params);
  const totalSum = await query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE ${conditions.join(' AND ')}`, params);

  const { rows } = await query(
    `SELECT * FROM expenses WHERE ${conditions.join(' AND ')}
     ORDER BY expense_date DESC, created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, parseInt(limit), offset]
  );

  return res.json({
    success: true, message: 'Expenses retrieved',
    data: rows,
    summary: { total: parseFloat(totalSum.rows[0].total) },
    pagination: formatPagination(parseInt(countResult.rows[0].count), page, limit)
  });
}

async function createExpense(req, res) {
  const { category, amount, expense_date, description, payment_method, receipt_url } = req.body;

  const { rows } = await query(
    `INSERT INTO expenses (category, amount, expense_date, description, payment_method, receipt_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [category, amount, expense_date || new Date(), description, payment_method || 'CASH', receipt_url, req.user.id]
  );

  return successResponse(res, 'Expense recorded', rows[0], 201);
}

async function updateExpense(req, res) {
  const { category, amount, expense_date, description, payment_method } = req.body;

  const { rows } = await query(
    `UPDATE expenses SET
       category = COALESCE($1, category), amount = COALESCE($2, amount),
       expense_date = COALESCE($3, expense_date), description = COALESCE($4, description),
       payment_method = COALESCE($5, payment_method), updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [category, amount, expense_date, description, payment_method, req.params.id]
  );
  if (rows.length === 0) return errorResponse(res, 'Expense not found.', null, 404);
  return successResponse(res, 'Expense updated', rows[0]);
}

async function deleteExpense(req, res) {
  const { rows } = await query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
  if (rows.length === 0) return errorResponse(res, 'Expense not found.', null, 404);
  return successResponse(res, 'Expense deleted');
}

async function getExpenseSummary(req, res) {
  const { year = new Date().getFullYear(), month } = req.query;

  let dateCondition = `EXTRACT(YEAR FROM expense_date) = $1`;
  const params = [year];

  if (month) {
    dateCondition += ` AND EXTRACT(MONTH FROM expense_date) = $2`;
    params.push(month);
  }

  const { rows: byCategory } = await query(
    `SELECT category, COALESCE(SUM(amount), 0) as total
     FROM expenses WHERE ${dateCondition}
     GROUP BY category ORDER BY total DESC`,
    params
  );

  const { rows: monthly } = await query(
    `SELECT EXTRACT(MONTH FROM expense_date) as month,
            TO_CHAR(expense_date, 'Mon') as month_name,
            COALESCE(SUM(amount), 0) as total
     FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1
     GROUP BY EXTRACT(MONTH FROM expense_date), TO_CHAR(expense_date, 'Mon')
     ORDER BY month`,
    [year]
  );

  const totalExpenses = byCategory.reduce((sum, r) => sum + parseFloat(r.total), 0);

  return successResponse(res, 'Expense summary retrieved', {
    byCategory,
    monthly,
    totalExpenses,
  });
}

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary };
