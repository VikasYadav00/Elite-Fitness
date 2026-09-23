// Elite Fitness - Payment Request Routes (UTR Flow)
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  submitPaymentRequest, getPaymentRequests, getMyPaymentRequests,
  verifyPaymentRequest, rejectPaymentRequest,
} = require('../controllers/paymentRequestController');

// Customer routes
router.post('/', authenticate, authorize('CUSTOMER'), submitPaymentRequest);
router.get('/me', authenticate, authorize('CUSTOMER'), getMyPaymentRequests);

// Owner routes
router.get('/', authenticate, authorize('OWNER'), getPaymentRequests);
router.post('/:id/verify', authenticate, authorize('OWNER'), verifyPaymentRequest);
router.post('/:id/reject', authenticate, authorize('OWNER'), rejectPaymentRequest);

module.exports = router;
