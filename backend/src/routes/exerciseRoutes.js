// Elite Fitness - Exercise Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getExercises, getExerciseById, createExercise, updateExercise
} = require('../controllers/workoutController');

router.get('/', authenticate, getExercises);
router.get('/:id', authenticate, getExerciseById);
router.post('/', authenticate, authorize('OWNER', 'TRAINER'), createExercise);
router.put('/:id', authenticate, authorize('OWNER', 'TRAINER'), updateExercise);

module.exports = router;
