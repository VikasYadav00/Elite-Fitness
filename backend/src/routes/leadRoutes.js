// Elite Fitness - Lead Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getLeads, getLeadById, createLead, updateLead, convertLeadToMember
} = require('../controllers/leadController');

router.get('/', authenticate, authorize('OWNER', 'TRAINER'), getLeads);
router.post('/', authenticate, authorize('OWNER', 'TRAINER'), createLead);
router.get('/:id', authenticate, authorize('OWNER', 'TRAINER'), getLeadById);
router.put('/:id', authenticate, authorize('OWNER', 'TRAINER'), updateLead);
router.post('/:id/convert', authenticate, authorize('OWNER'), convertLeadToMember);

module.exports = router;
