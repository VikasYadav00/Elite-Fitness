// Elite Fitness - Feedback & Review Routes
const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbacks,
  updateFeedbackStatus,
  deleteFeedback
} = require('../controllers/feedbackController');

// Public route: Google Lens QR scan / web feedback submission (no login required)
router.post('/', submitFeedback);

// Retrieval: Can be viewed by Owner or for public reviews summary
router.get('/', getFeedbacks);

// Management: Owner update status / add owner notes
router.patch('/:id/status', updateFeedbackStatus);
router.delete('/:id', deleteFeedback);

module.exports = router;
