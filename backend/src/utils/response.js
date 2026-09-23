// Elite Fitness - Response Helpers
function successResponse(res, message, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, message, error = null, statusCode = 400) {
  const response = {
    success: false,
    message,
  };
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error;
  }
  return res.status(statusCode).json(response);
}

function paginateResponse(res, message, data, pagination) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

function getPagination(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return { limit: parseInt(limit), offset, page: parseInt(page) };
}

function formatPagination(total, page, limit) {
  return {
    total: parseInt(total),
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = { successResponse, errorResponse, paginateResponse, getPagination, formatPagination };
