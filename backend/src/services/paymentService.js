// Elite Fitness - Razorpay Payment Service
const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    if (
      !process.env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder'
    ) {
      logger.warn('Razorpay credentials not configured - using test mode');
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

async function createOrder(amount, currency = 'INR', receipt = null) {
  const razorpay = getRazorpay();

  // Test/dev mode - return simulated order
  if (!razorpay) {
    const testOrderId = `order_test_${Date.now()}`;
    return {
      id: testOrderId,
      amount: amount * 100,
      currency,
      receipt,
      status: 'created',
      testMode: true,
    };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // Razorpay uses paise
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  });

  logger.info(`Razorpay order created: ${order.id}`);
  return order;
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = expectedSignature === signature;

  if (!isValid) {
    logger.warn(`Payment signature verification failed: orderId=${orderId}, paymentId=${paymentId}`);
  }

  return isValid;
}

async function fetchPaymentDetails(paymentId) {
  const razorpay = getRazorpay();
  if (!razorpay) return null;

  try {
    return await razorpay.payments.fetch(paymentId);
  } catch (error) {
    logger.error('Failed to fetch payment details:', error.message);
    return null;
  }
}

module.exports = { createOrder, verifyPaymentSignature, fetchPaymentDetails };
