// Elite Fitness - Dashboard Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getDashboardStats, getRevenueChart, getExpensesChart, getAttendanceChart,
  getRecentRegistrations, getRecentPayments, getExpiringMemberships
} = require('../controllers/dashboardController');

router.get('/stats', authenticate, authorize('OWNER'), getDashboardStats);
router.get('/charts/revenue', authenticate, authorize('OWNER'), getRevenueChart);
router.get('/charts/expenses', authenticate, authorize('OWNER'), getExpensesChart);
router.get('/charts/attendance', authenticate, authorize('OWNER', 'TRAINER'), getAttendanceChart);
router.get('/recent-registrations', authenticate, authorize('OWNER'), getRecentRegistrations);
router.get('/recent-payments', authenticate, authorize('OWNER'), getRecentPayments);
router.get('/expiring-memberships', authenticate, authorize('OWNER'), getExpiringMemberships);

module.exports = router;
