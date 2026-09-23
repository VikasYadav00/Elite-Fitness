// Elite Fitness - Payment Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  createPaymentOrder, verifyPayment, getPayments, getPaymentById
} = require('../controllers/paymentController');

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.get('/', authenticate, authorize('OWNER'), getPayments);
router.get('/:id', authenticate, getPaymentById);

module.exports = router;
