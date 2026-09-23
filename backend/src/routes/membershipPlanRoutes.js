// Elite Fitness - Membership Plan Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getPlans, getPlanById, createPlan, updatePlan
} = require('../controllers/membershipController');

router.get('/', getPlans); // Public listing for QR web app & mobile apps
router.get('/:id', getPlanById);
router.post('/', authenticate, authorize('OWNER'), createPlan);
router.put('/:id', authenticate, authorize('OWNER'), updatePlan);

module.exports = router;
