// Elite Fitness - Authentication & Authorization Middleware
const { verifyToken } = require('../utils/jwt');
const { query } = require('../config/database');
const { errorResponse } = require('../utils/response');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No authentication token provided.', null, 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const { rows } = await query(
      'SELECT id, full_name, phone, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (rows.length === 0) {
      return errorResponse(res, 'User account not found.', null, 401);
    }

    const user = rows[0];

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Your account has been suspended. Please contact Elite Fitness.', null, 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please login again.', null, 401);
    }
    return errorResponse(res, 'Invalid authentication token.', null, 401);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated.', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        null,
        403
      );
    }

    next();
  };
}

// Middleware to ensure customer can only access their own data
async function ownDataOnly(req, res, next) {
  if (req.user.role === 'OWNER') return next(); // Owner can access all

  const requestedMemberId = req.params.memberId || req.params.id;

  if (req.user.role === 'CUSTOMER' && requestedMemberId) {
    const { rows } = await query(
      'SELECT id FROM members WHERE id = $1 AND user_id = $2',
      [requestedMemberId, req.user.id]
    );
    if (rows.length === 0) {
      return errorResponse(res, 'Access denied. You can only access your own data.', null, 403);
    }
  }

  next();
}

module.exports = { authenticate, authorize, ownDataOnly };
