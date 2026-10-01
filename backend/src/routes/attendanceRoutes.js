// Elite Fitness - Attendance Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  checkIn, checkOut, qrCheckIn, getAttendance, getTodayAttendance, manualAttendance,
  generateAttendanceQR, qrSessionCheckIn, publicTableCheckIn, getAttendanceMembers
} = require('../controllers/attendanceController');

// Public route for table QR scanning from member's mobile phone
router.post('/public-checkin', publicTableCheckIn);

router.post('/check-in', authenticate, checkIn);
router.post('/check-out', authenticate, checkOut);
router.post('/qr-check-in', authenticate, qrCheckIn);
router.post('/generate-qr', authenticate, authorize('OWNER'), generateAttendanceQR);
router.post('/session-checkin', authenticate, qrSessionCheckIn);
router.get('/today', authenticate, authorize('OWNER', 'TRAINER'), getTodayAttendance);
router.get('/roster', authenticate, authorize('OWNER', 'TRAINER'), getAttendanceMembers);
router.get('/', authenticate, getAttendance);
router.post('/manual', authenticate, authorize('OWNER', 'TRAINER'), manualAttendance);

module.exports = router;
