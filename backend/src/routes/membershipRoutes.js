// Elite Fitness - Membership Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getMemberships, getExpiringSoon, assignMembership,
  freezeMembership, unfreezeMembership, getMemberMemberships
} = require('../controllers/membershipController');

router.get('/', authenticate, authorize('OWNER', 'TRAINER'), getMemberships);
router.get('/expiring-soon', authenticate, authorize('OWNER'), getExpiringSoon);
router.post('/assign', authenticate, authorize('OWNER'), assignMembership);
router.post('/:id/freeze', authenticate, authorize('OWNER'), freezeMembership);
router.post('/:id/unfreeze', authenticate, authorize('OWNER'), unfreezeMembership);
router.get('/member/:memberId', authenticate, getMemberMemberships);

module.exports = router;
