// Elite Fitness - Registration Routes (QR Registration)
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  sendRegistrationOTP, verifyRegistrationOTP, createRegistrationOrder,
  completeRegistration, getRegistrations, getRegistrationStatus
} = require('../controllers/registrationController');

router.post('/send-otp', sendRegistrationOTP);
router.post('/verify-otp', verifyRegistrationOTP);
router.post('/create-order', createRegistrationOrder);
router.post('/complete', completeRegistration);
router.get('/status/:identifier', getRegistrationStatus);
router.get('/', authenticate, authorize('OWNER'), getRegistrations);

module.exports = router;

