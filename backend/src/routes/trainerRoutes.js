// Elite Fitness - Trainer Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getTrainers, getTrainerById, createTrainer, updateTrainer, deactivateTrainer
} = require('../controllers/trainerController');

router.get('/', authenticate, getTrainers);
router.post('/', authenticate, authorize('OWNER'), createTrainer);
router.get('/:id', authenticate, getTrainerById);
router.put('/:id', authenticate, authorize('OWNER'), updateTrainer);
router.delete('/:id', authenticate, authorize('OWNER'), deactivateTrainer);

module.exports = router;
