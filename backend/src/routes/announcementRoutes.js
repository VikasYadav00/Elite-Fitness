// Elite Fitness - Announcement Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getAnnouncements, createAnnouncement, updateAnnouncement
} = require('../controllers/notificationController');

router.get('/', getAnnouncements); // Public / Customer announcements
router.post('/', authenticate, authorize('OWNER'), createAnnouncement);
router.put('/:id', authenticate, authorize('OWNER'), updateAnnouncement);

module.exports = router;
