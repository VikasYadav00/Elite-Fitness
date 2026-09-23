// Elite Fitness - Diet Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getDietPlans, getDietPlanById, createDietPlan, updateDietPlan,
  assignDietToMember, getMemberDiet, getMyDiet
} = require('../controllers/dietController');

router.get('/my', authenticate, getMyDiet);
router.get('/', authenticate, getDietPlans);
router.get('/:id', authenticate, getDietPlanById);
router.post('/', authenticate, authorize('OWNER', 'TRAINER'), createDietPlan);
router.put('/:id', authenticate, authorize('OWNER', 'TRAINER'), updateDietPlan);
router.post('/assign', authenticate, authorize('OWNER', 'TRAINER'), assignDietToMember);
router.get('/member/:memberId', authenticate, getMemberDiet);

module.exports = router;
