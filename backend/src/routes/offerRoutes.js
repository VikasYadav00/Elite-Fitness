// Elite Fitness - Offer Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getOffers, createOffer, updateOffer
} = require('../controllers/notificationController');

router.get('/', getOffers); // Public / Customer active offers
router.post('/', authenticate, authorize('OWNER'), createOffer);
router.put('/:id', authenticate, authorize('OWNER'), updateOffer);

module.exports = router;
