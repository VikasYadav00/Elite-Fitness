// Elite Fitness - Member Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getMembers, getMemberById, createMember, updateMember, deactivateMember,
  getMemberAttendance, getMemberPayments, getMyProfile, updateMyProfile, updateMemberStatus
} = require('../controllers/memberController');


router.get('/me', authenticate, authorize('CUSTOMER'), getMyProfile);
router.put('/me', authenticate, authorize('CUSTOMER'), updateMyProfile);
router.get('/', authenticate, authorize('OWNER', 'TRAINER'), getMembers);
router.post('/', authenticate, authorize('OWNER'), createMember);
router.get('/:id', authenticate, getMemberById);
router.put('/:id', authenticate, authorize('OWNER', 'TRAINER'), updateMember);
router.delete('/:id', authenticate, authorize('OWNER'), deactivateMember);
router.patch('/:id/status', authenticate, authorize('OWNER'), updateMemberStatus);
router.get('/:id/attendance', authenticate, getMemberAttendance);
router.get('/:id/payments', authenticate, getMemberPayments);


module.exports = router;
