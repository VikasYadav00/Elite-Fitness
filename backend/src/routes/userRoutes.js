// Elite Fitness - User Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { getMyProfile, updateMyProfile } = require('../controllers/memberController');

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);

module.exports = router;
