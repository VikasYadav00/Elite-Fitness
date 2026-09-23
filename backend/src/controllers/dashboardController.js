// Elite Fitness - Dashboard Controller
const { query } = require('../config/database');
const { successResponse } = require('../utils/response');

// GET /api/dashboard/stats
async function getDashboardStats(req, res) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const [
    membersResult,
    activeMembersResult,
    expiredMembersResult,
    newThisMonthResult,
    todayAttendanceResult,
    monthlyRevenueResult,
    monthlyExpensesResult,
    pendingPaymentsResult,
    expiringSoonResult,
  ] = await Promise.all([
    query('SELECT COUNT(*) FROM members'),
    query(`SELECT COUNT(*) FROM members WHERE status = 'ACTIVE'`),
    query(`SELECT COUNT(*) FROM members WHERE status = 'EXPIRED'`),
    query(`SELECT COUNT(*) FROM members WHERE DATE(joining_date) >= $1`, [startOfMonth]),
    query(`SELECT COUNT(*) FROM attendance WHERE date = $1`, [today]),
    query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'SUCCESS'
       AND payment_date >= $1 AND payment_date <= $2`,
      [startOfMonth, endOfMonth + ' 23:59:59']
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
       WHERE expense_date >= $1 AND expense_date <= $2`,
      [startOfMonth, endOfMonth]
    ),
    query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'PENDING'`),
    query(
      `SELECT COUNT(*) FROM memberships WHERE membership_status = 'ACTIVE'
       AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`
    ),
  ]);

  const revenue = parseFloat(monthlyRevenueResult.rows[0].total);
  const expenses = parseFloat(monthlyExpensesResult.rows[0].total);

  return successResponse(res, 'Dashboard stats retrieved', {
    totalMembers: parseInt(membersResult.rows[0].count),
    activeMembers: parseInt(activeMembersResult.rows[0].count),
    expiredMembers: parseInt(expiredMembersResult.rows[0].count),
    newRegistrations: parseInt(newThisMonthResult.rows[0].count),
    todayAttendance: parseInt(todayAttendanceResult.rows[0].count),
    monthlyRevenue: revenue,
    monthlyExpenses: expenses,
    netProfit: revenue - expenses,
    pendingPayments: parseFloat(pendingPaymentsResult.rows[0].total),
    membershipsExpiringSoon: parseInt(expiringSoonResult.rows[0].count),
  });
}

// GET /api/dashboard/revenue-chart
async function getRevenueChart(req, res) {
  const { year = new Date().getFullYear() } = req.query;

  const { rows } = await query(
    `SELECT
       EXTRACT(MONTH FROM payment_date) as month,
       TO_CHAR(payment_date, 'Mon') as month_name,
       COALESCE(SUM(amount), 0) as revenue
     FROM payments
     WHERE status = 'SUCCESS' AND EXTRACT(YEAR FROM payment_date) = $1
     GROUP BY EXTRACT(MONTH FROM payment_date), TO_CHAR(payment_date, 'Mon')
     ORDER BY month`,
    [year]
  );

  // Fill missing months with 0
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = monthNames.map((name, i) => {
    const found = rows.find((r) => parseInt(r.month) === i + 1);
    return { month: name, revenue: found ? parseFloat(found.revenue) : 0 };
  });

  return successResponse(res, 'Revenue chart data retrieved', chartData);
}

// GET /api/dashboard/expenses-chart
async function getExpensesChart(req, res) {
  const { year = new Date().getFullYear() } = req.query;

  const { rows } = await query(
    `SELECT
       EXTRACT(MONTH FROM expense_date) as month,
       TO_CHAR(expense_date, 'Mon') as month_name,
       COALESCE(SUM(amount), 0) as expenses
     FROM expenses
     WHERE EXTRACT(YEAR FROM expense_date) = $1
     GROUP BY EXTRACT(MONTH FROM expense_date), TO_CHAR(expense_date, 'Mon')
     ORDER BY month`,
    [year]
  );

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = monthNames.map((name, i) => {
    const found = rows.find((r) => parseInt(r.month) === i + 1);
    return { month: name, expenses: found ? parseFloat(found.expenses) : 0 };
  });

  return successResponse(res, 'Expenses chart data retrieved', chartData);
}

// GET /api/dashboard/attendance-chart
async function getAttendanceChart(req, res) {
  const { days = 30 } = req.query;

  const { rows } = await query(
    `SELECT date, COUNT(*) as count
     FROM attendance
     WHERE date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
     GROUP BY date
     ORDER BY date ASC`
  );

  return successResponse(res, 'Attendance chart data retrieved', rows);
}

// GET /api/dashboard/recent-registrations
async function getRecentRegistrations(req, res) {
  const { rows } = await query(
    `SELECT m.registration_id, u.full_name, u.phone, m.joining_date, m.status,
            mp.plan_name, mb.payment_status
     FROM members m
     INNER JOIN users u ON u.id = m.user_id
     LEFT JOIN memberships mb ON mb.member_id = m.id AND mb.membership_status = 'ACTIVE'
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     ORDER BY m.created_at DESC LIMIT 10`
  );

  return successResponse(res, 'Recent registrations retrieved', rows);
}

// GET /api/dashboard/recent-payments
async function getRecentPayments(req, res) {
  const { rows } = await query(
    `SELECT p.invoice_number, p.amount, p.payment_method, p.status, p.payment_date,
            u.full_name, mp.plan_name
     FROM payments p
     LEFT JOIN members m ON m.id = p.member_id
     LEFT JOIN users u ON u.id = m.user_id
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     ORDER BY p.created_at DESC LIMIT 10`
  );

  return successResponse(res, 'Recent payments retrieved', rows);
}

// GET /api/dashboard/expiring-memberships
async function getExpiringMemberships(req, res) {
  const { rows } = await query(
    `SELECT mb.end_date, (mb.end_date - CURRENT_DATE) as days_remaining,
            u.full_name, u.phone, mp.plan_name, m.registration_id
     FROM memberships mb
     INNER JOIN members m ON m.id = mb.member_id
     INNER JOIN users u ON u.id = m.user_id
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE mb.membership_status = 'ACTIVE'
       AND mb.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
     ORDER BY mb.end_date ASC
     LIMIT 15`
  );

  return successResponse(res, 'Expiring memberships retrieved', rows);
}

module.exports = {
  getDashboardStats, getRevenueChart, getExpensesChart, getAttendanceChart,
  getRecentRegistrations, getRecentPayments, getExpiringMemberships
};
