// Elite Fitness - Progress Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getMemberProgress, getMyProgress, addProgressRecord, addProgressPhoto
} = require('../controllers/progressController');

router.get('/my', authenticate, getMyProgress);
router.get('/member/:memberId', authenticate, getMemberProgress);
router.post('/record', authenticate, addProgressRecord);
router.post('/photo', authenticate, addProgressPhoto);

module.exports = router;
