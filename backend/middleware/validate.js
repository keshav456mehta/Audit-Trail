const { AppError } = require('../errors');

const ID_PATTERN = /^[A-Za-z0-9._:-]{1,64}$/;

function assertValidId(value, field = 'shipment id') {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new AppError(400, 'INVALID_ID', `${field} must be 1-64 characters: letters, digits, ".", "_", ":" or "-"`);
  }
  return value;
}

module.exports = { assertValidId, ID_PATTERN };
