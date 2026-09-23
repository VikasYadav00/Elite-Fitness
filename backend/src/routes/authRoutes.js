// Elite Fitness - Auth Routes
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  register, login, sendOTP, verifyOTPRoute, forgotPassword,
  resetPassword, changePassword, updateFcmToken, logout
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPRoute);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticate, changePassword);
router.put('/fcm-token', authenticate, updateFcmToken);
router.post('/logout', authenticate, logout);

module.exports = router;
