const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { assertValidId } = require('../middleware/validate');
const { AppError } = require('../errors');
const { ALL_EVENT_TYPES } = require('../domain/shipment');
const { appendEvent } = require('../services/eventAppender');
const { serializeEvent } = require('../services/serializers');

/** CQRS write side: the only router that can add events. */
const router = express.Router();

const IDEMPOTENCY_KEY = /^[A-Za-z0-9._:-]{1,128}$/;

router.post('/move', authenticate, requireRole('operator'), async (req, res) => {
  const { aggregateId, eventType, payload, expectedVersion, idempotencyKey } = req.body ?? {};

  assertValidId(aggregateId, 'aggregateId');

  if (typeof eventType !== 'string' || !eventType.trim()) {
    throw new AppError(400, 'EVENT_TYPE_REQUIRED', 'aggregateId and eventType are required');
  }
  if (!ALL_EVENT_TYPES.includes(eventType)) {
    throw new AppError(400, 'UNKNOWN_EVENT_TYPE', `eventType must be one of: ${ALL_EVENT_TYPES.join(', ')}`);
  }
  if (payload === undefined || payload === null) {
    throw new AppError(400, 'PAYLOAD_REQUIRED', 'payload is required');
  }
  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError(400, 'PAYLOAD_NOT_OBJECT', 'payload must be a JSON object');
  }
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) {
    throw new AppError(
      400,
      'EXPECTED_VERSION_REQUIRED',
      'expectedVersion (integer >= 0) is required: send the version you last loaded (0 for a new shipment)',
    );
  }
  if (idempotencyKey !== undefined && (typeof idempotencyKey !== 'string' || !IDEMPOTENCY_KEY.test(idempotencyKey))) {
    throw new AppError(400, 'INVALID_IDEMPOTENCY_KEY', 'idempotencyKey must be 1-128 characters: letters, digits, ".", "_", ":" or "-"');
  }

  const result = await appendEvent({ aggregateId, eventType, payload, expectedVersion, idempotencyKey });

  res.status(result.replayed ? 200 : 201).json({
    success: true,
    message: result.replayed ? 'Event already recorded (idempotent replay)' : 'Shipment event recorded',
    replayed: result.replayed,
    event: serializeEvent(result.event),
    ...(result.state ? { currentState: result.state } : {}),
  });
});

module.exports = router;
