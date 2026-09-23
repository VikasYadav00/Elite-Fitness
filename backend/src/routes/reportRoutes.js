// Elite Fitness - Report Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getRevenueReport, getMembershipReport, getAttendanceReport,
  getExpensesReport, getProfitLossReport, exportExcel
} = require('../controllers/reportController');

router.get('/revenue', authenticate, authorize('OWNER'), getRevenueReport);
router.get('/memberships', authenticate, authorize('OWNER'), getMembershipReport);
router.get('/attendance', authenticate, authorize('OWNER', 'TRAINER'), getAttendanceReport);
router.get('/expenses', authenticate, authorize('OWNER'), getExpensesReport);
router.get('/profit-loss', authenticate, authorize('OWNER'), getProfitLossReport);
router.get('/export-excel', authenticate, authorize('OWNER'), exportExcel);

module.exports = router;
