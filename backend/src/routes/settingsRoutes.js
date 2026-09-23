// Elite Fitness - Settings Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getSettings, updateSettings, getRegistrationQR, getPublicSettings, getPaymentQR, updatePaymentQR
} = require('../controllers/settingsController');

router.get('/public', getPublicSettings);
router.get('/payment-qr', getPaymentQR);
router.put('/payment-qr', updatePaymentQR);
router.get('/', authenticate, getSettings);
router.put('/', authenticate, authorize('OWNER'), updateSettings);
router.get('/qr', authenticate, authorize('OWNER'), getRegistrationQR);

module.exports = router;
