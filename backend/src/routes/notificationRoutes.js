// Elite Fitness - Notification Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getMyNotifications, markNotificationRead, broadcastNotification
} = require('../controllers/notificationController');

router.get('/my', authenticate, getMyNotifications);
router.put('/:id/read', authenticate, markNotificationRead);
router.post('/broadcast', authenticate, authorize('OWNER'), broadcastNotification);

module.exports = router;
