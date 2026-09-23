// Elite Fitness - Reports Controller (PDF & Excel)
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

// GET /api/reports/revenue
async function getRevenueReport(req, res) {
  const { from_date, to_date, year = new Date().getFullYear() } = req.query;

  const fromDate = from_date || `${year}-01-01`;
  const toDate = to_date || `${year}-12-31`;

  const { rows: payments } = await query(
    `SELECT p.invoice_number, p.amount, p.payment_method, p.payment_date, p.status,
            u.full_name, mp.plan_name
     FROM payments p
     LEFT JOIN members m ON m.id = p.member_id
     LEFT JOIN users u ON u.id = m.user_id
     LEFT JOIN memberships mb ON mb.id = p.membership_id
     LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
     WHERE p.status = 'SUCCESS' AND p.payment_date >= $1 AND p.payment_date <= $2
     ORDER BY p.payment_date DESC`,
    [fromDate, toDate + ' 23:59:59']
  );

  const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const { rows: expenses } = await query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
     WHERE expense_date >= $1 AND expense_date <= $2`,
    [fromDate, toDate]
  );

  const totalExpenses = parseFloat(expenses[0].total);

  return successResponse(res, 'Revenue report generated', {
    period: { from: fromDate, to: toDate },
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      transactionCount: payments.length,
    },
    payments,
  });
}

// GET /api/reports/membership
async function getMembershipReport(req, res) {
  const { status, from_date, to_date } = req.query;

  const { rows } = await query(
    `SELECT mb.*, mp.plan_name, mp.duration_months,
            u.full_name, u.phone, m.registration_id,
            (mb.end_date - CURRENT_DATE) as days_remaining
     FROM memberships mb
     INNER JOIN membership_plans mp ON mp.id = mb.plan_id
     INNER JOIN members m ON m.id = mb.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE ($1::text IS NULL OR mb.membership_status = $1)
       AND ($2::date IS NULL OR mb.created_at >= $2)
       AND ($3::date IS NULL OR mb.created_at <= $3)
     ORDER BY mb.end_date ASC`,
    [status || null, from_date || null, to_date || null]
  );

  const summary = {
    total: rows.length,
    active: rows.filter(r => r.membership_status === 'ACTIVE').length,
    expired: rows.filter(r => r.membership_status === 'EXPIRED').length,
    frozen: rows.filter(r => r.membership_status === 'FROZEN').length,
    expiringSoon: rows.filter(r => r.membership_status === 'ACTIVE' && parseInt(r.days_remaining) <= 30).length,
  };

  return successResponse(res, 'Membership report generated', { summary, memberships: rows });
}

// GET /api/reports/attendance
async function getAttendanceReport(req, res) {
  const { from_date, to_date, member_id } = req.query;

  let conditions = ['1=1'];
  const params = [];
  let idx = 1;

  if (from_date) { conditions.push(`a.date >= $${idx++}`); params.push(from_date); }
  if (to_date) { conditions.push(`a.date <= $${idx++}`); params.push(to_date); }
  if (member_id) { conditions.push(`a.member_id = $${idx++}`); params.push(member_id); }

  const { rows } = await query(
    `SELECT a.*, u.full_name, u.phone, m.registration_id
     FROM attendance a
     INNER JOIN members m ON m.id = a.member_id
     INNER JOIN users u ON u.id = m.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.date DESC`,
    params
  );

  const summary = {
    total: rows.length,
    present: rows.filter(r => r.status === 'PRESENT').length,
    manual: rows.filter(r => r.method === 'MANUAL').length,
    qr: rows.filter(r => r.method === 'QR').length,
  };

  return successResponse(res, 'Attendance report generated', { summary, records: rows });
}

// GET /api/reports/expenses
async function getExpensesReport(req, res) {
  const { year = new Date().getFullYear(), month } = req.query;

  let dateCondition = `EXTRACT(YEAR FROM expense_date) = $1`;
  const params = [year];

  if (month) {
    dateCondition += ` AND EXTRACT(MONTH FROM expense_date) = $2`;
    params.push(month);
  }

  const { rows: expenses } = await query(
    `SELECT * FROM expenses WHERE ${dateCondition} ORDER BY expense_date DESC`, params
  );

  const { rows: byCategory } = await query(
    `SELECT category, SUM(amount) as total, COUNT(*) as count
     FROM expenses WHERE ${dateCondition}
     GROUP BY category ORDER BY total DESC`,
    params
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return successResponse(res, 'Expense report generated', {
    summary: { total: totalExpenses, count: expenses.length },
    byCategory,
    expenses,
  });
}

// GET /api/reports/profit-loss
async function getProfitLossReport(req, res) {
  const { year = new Date().getFullYear() } = req.query;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const { rows: revenue } = await query(
    `SELECT EXTRACT(MONTH FROM payment_date) as month, COALESCE(SUM(amount), 0) as total
     FROM payments WHERE status = 'SUCCESS' AND EXTRACT(YEAR FROM payment_date) = $1
     GROUP BY month ORDER BY month`,
    [year]
  );

  const { rows: expenses } = await query(
    `SELECT EXTRACT(MONTH FROM expense_date) as month, COALESCE(SUM(amount), 0) as total
     FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1
     GROUP BY month ORDER BY month`,
    [year]
  );

  const report = monthNames.map((name, i) => {
    const revRow = revenue.find(r => parseInt(r.month) === i + 1);
    const expRow = expenses.find(e => parseInt(e.month) === i + 1);
    const rev = revRow ? parseFloat(revRow.total) : 0;
    const exp = expRow ? parseFloat(expRow.total) : 0;
    return { month: name, revenue: rev, expenses: exp, profit: rev - exp };
  });

  const totals = {
    revenue: report.reduce((s, r) => s + r.revenue, 0),
    expenses: report.reduce((s, r) => s + r.expenses, 0),
    profit: report.reduce((s, r) => s + r.profit, 0),
  };

  return successResponse(res, 'Profit & Loss report generated', { year, monthly: report, totals });
}

// GET /api/reports/export/excel - Export report as Excel
async function exportExcel(req, res) {
  const { type = 'payments', from_date, to_date, year = new Date().getFullYear() } = req.query;

  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Elite Fitness Management System';

  const worksheet = workbook.addWorksheet('Elite Fitness Report');

  // Header styling
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
    border: {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    }
  };

  if (type === 'payments') {
    worksheet.columns = [
      { header: 'Invoice No.', key: 'invoice', width: 20 },
      { header: 'Member Name', key: 'name', width: 25 },
      { header: 'Plan', key: 'plan', width: 20 },
      { header: 'Amount (₹)', key: 'amount', width: 15 },
      { header: 'Method', key: 'method', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    const { rows } = await query(
      `SELECT p.invoice_number, u.full_name, mp.plan_name, p.amount, p.payment_method, p.payment_date, p.status
       FROM payments p
       LEFT JOIN members m ON m.id = p.member_id LEFT JOIN users u ON u.id = m.user_id
       LEFT JOIN memberships mb ON mb.id = p.membership_id LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
       WHERE p.status = 'SUCCESS' ORDER BY p.payment_date DESC LIMIT 1000`
    );

    rows.forEach(r => worksheet.addRow({
      invoice: r.invoice_number, name: r.full_name, plan: r.plan_name,
      amount: parseFloat(r.amount), method: r.payment_method,
      date: r.payment_date ? new Date(r.payment_date).toLocaleDateString('en-IN') : '',
      status: r.status
    }));
  } else if (type === 'members') {
    worksheet.columns = [
      { header: 'Reg ID', key: 'reg_id', width: 18 },
      { header: 'Full Name', key: 'name', width: 25 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Joining Date', key: 'joining', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Current Plan', key: 'plan', width: 20 },
      { header: 'Expiry Date', key: 'expiry', width: 18 },
    ];

    const { rows } = await query(
      `SELECT m.registration_id, u.full_name, u.phone, u.email, m.joining_date, m.status,
              mp.plan_name, mb.end_date
       FROM members m INNER JOIN users u ON u.id = m.user_id
       LEFT JOIN memberships mb ON mb.member_id = m.id AND mb.membership_status = 'ACTIVE'
       LEFT JOIN membership_plans mp ON mp.id = mb.plan_id
       ORDER BY m.joining_date DESC LIMIT 1000`
    );

    rows.forEach(r => worksheet.addRow({
      reg_id: r.registration_id, name: r.full_name, phone: r.phone, email: r.email,
      joining: r.joining_date ? new Date(r.joining_date).toLocaleDateString('en-IN') : '',
      status: r.status, plan: r.plan_name || 'None',
      expiry: r.end_date ? new Date(r.end_date).toLocaleDateString('en-IN') : ''
    }));
  }

  // Style header row
  worksheet.getRow(1).eachCell(cell => { Object.assign(cell, headerStyle); });
  worksheet.getRow(1).height = 30;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=elite-fitness-${type}-report.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { getRevenueReport, getMembershipReport, getAttendanceReport, getExpensesReport, getProfitLossReport, exportExcel };
