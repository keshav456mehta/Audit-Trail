const crypto = require('node:crypto');
const EventStore = require('../models/EventStore');
const eventBus = require('./eventBus');
const { AppError } = require('../errors');
const { GENESIS_HASH, canonicalize, computeEventHash } = require('../domain/hash');
const { fold, apply, decide, describe } = require('../domain/shipment');

const sameContent = (event, eventType, payload) =>
  event.eventType === eventType && canonicalize(event.payload) === canonicalize(payload);

async function loadStream(aggregateId) {
  return EventStore.find({ aggregateId }).sort({ version: 1 }).lean();
}

async function replayIfKnown(aggregateId, idempotencyKey, eventType, payload) {
  const existing = await EventStore.findOne({ aggregateId, idempotencyKey }).lean();
  if (!existing) return null;
  if (!sameContent(existing, eventType, payload)) {
    throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This idempotencyKey was already used for a different event');
  }
  return existing;
}

/**
 * The single write path into the event store.
 *
 * Optimistic concurrency control: the caller states the version it last saw
 * (`expectedVersion`). If the stream has moved on, the command is REJECTED
 * with 409 - it is never silently re-based onto the newer state.
 * The unique {aggregateId, version} index makes this race-proof in the DB.
 *
 * `occurredAt` is for seeding/import only and is never exposed through the API.
 */
async function appendEvent({ aggregateId, eventType, payload, expectedVersion, idempotencyKey, occurredAt }) {
  if (idempotencyKey) {
    const replay = await replayIfKnown(aggregateId, idempotencyKey, eventType, payload);
    if (replay) return { event: replay, replayed: true };
  }

  const events = await loadStream(aggregateId);
  const state = fold(events, aggregateId);

  if (expectedVersion !== state.version) {
    if (idempotencyKey) {
      // A retry of a command that already landed (e.g. the response was lost) is a replay, not a conflict.
      const replay = await replayIfKnown(aggregateId, idempotencyKey, eventType, payload);
      if (replay) return { event: replay, replayed: true };
    }
    throw new AppError(409, 'VERSION_CONFLICT', 'The shipment changed since you loaded it. Reload and retry.', {
      expectedVersion,
      currentVersion: state.version,
    });
  }

  const rejection = decide(state, eventType, payload);
  if (rejection) {
    throw new AppError(422, rejection.code, rejection.message, { allowedNext: rejection.allowedNext });
  }

  const lastTimestamp = events.length ? new Date(events[events.length - 1].timestamp) : null;
  let timestamp = occurredAt ? new Date(occurredAt) : new Date();
  if (lastTimestamp && timestamp < lastTimestamp) {
    if (occurredAt) throw new AppError(422, 'TIMESTAMP_REGRESSION', 'occurredAt is earlier than the previous event');
    timestamp = lastTimestamp; // clock skew between instances must never reorder history
  }

  const fields = {
    aggregateId,
    eventType,
    payload,
    timestamp,
    version: state.version + 1,
    idempotencyKey: idempotencyKey || crypto.randomUUID(),
    prevHash: state.lastHash ?? GENESIS_HASH,
  };
  fields.hash = computeEventHash(fields);

  let created;
  try {
    created = await EventStore.create(fields);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    // Lost a race: either the same retry key already landed, or another writer took our version.
    if (idempotencyKey) {
      const replay = await replayIfKnown(aggregateId, idempotencyKey, eventType, payload);
      if (replay) return { event: replay, replayed: true };
    }
    const latest = await EventStore.findOne({ aggregateId }).sort({ version: -1 }).lean();
    throw new AppError(409, 'VERSION_CONFLICT', 'The shipment changed since you loaded it. Reload and retry.', {
      expectedVersion,
      currentVersion: latest?.version ?? state.version + 1,
    });
  }

  const event = created.toObject();
  eventBus.emit('event.appended', { aggregateId, version: event.version });
  return { event, replayed: false, state: describe(apply(state, event)) };
}

module.exports = { appendEvent, loadStream };
