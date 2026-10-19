const mongoose = require('mongoose');
const { AppError, ImmutableEventError } = require('../errors');

function notFound(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, _next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (error instanceof AppError) {
    ({ status, code, message, details } = error);
  } else if (error instanceof ImmutableEventError) {
    status = 405;
    code = error.code;
    message = error.message;
  } else if (error.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 400;
    code = 'VALIDATION_FAILED';
    message = 'Validation failed';
    details = Object.fromEntries(Object.entries(error.errors).map(([k, v]) => [k, v.message]));
  }

  if (status >= 500) {
    console.error(`${req.method} ${req.originalUrl} failed:`, error);
  }
  res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
}

module.exports = { notFound, errorHandler };
