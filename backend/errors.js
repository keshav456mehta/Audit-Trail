/** Errors carrying an HTTP status and a stable machine-readable code. */
class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ImmutableEventError extends Error {
  constructor(operation) {
    super(`EventStore is append-only: "${operation}" is not allowed`);
    this.name = 'ImmutableEventError';
    this.code = 'EVENT_STORE_IMMUTABLE';
  }
}

module.exports = { AppError, ImmutableEventError };
