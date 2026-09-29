// Elite Fitness - Complaint & Support Routes
const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getComplaints,
  updateComplaintStatus,
  deleteComplaint
} = require('../controllers/complaintController');

// Public route: Universal QR complaint submission (no login required)
router.post('/', submitComplaint);

// Owner management routes
router.get('/', getComplaints);
router.patch('/:id/status', updateComplaintStatus);
router.delete('/:id', deleteComplaint);

module.exports = router;
