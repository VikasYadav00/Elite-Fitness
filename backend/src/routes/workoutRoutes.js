// Elite Fitness - Workout Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getWorkoutPlans, getWorkoutPlanById, createWorkoutPlan, updateWorkoutPlan,
  assignWorkoutToMember, getMemberWorkout, getMyWorkout
} = require('../controllers/workoutController');

router.get('/my', authenticate, getMyWorkout);
router.get('/', authenticate, getWorkoutPlans);
router.get('/:id', authenticate, getWorkoutPlanById);
router.post('/', authenticate, authorize('OWNER', 'TRAINER'), createWorkoutPlan);
router.put('/:id', authenticate, authorize('OWNER', 'TRAINER'), updateWorkoutPlan);
router.post('/assign', authenticate, authorize('OWNER', 'TRAINER'), assignWorkoutToMember);
router.get('/member/:memberId', authenticate, getMemberWorkout);

module.exports = router;
