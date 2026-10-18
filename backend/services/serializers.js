/** Shape of an event in API responses (works for lean docs and Mongoose docs). */
function serializeEvent(event) {
  const e = typeof event.toObject === 'function' ? event.toObject() : event;
  return {
    id: String(e._id),
    aggregateId: e.aggregateId,
    eventType: e.eventType,
    payload: e.payload,
    timestamp: new Date(e.timestamp).toISOString(),
    version: e.version,
    idempotencyKey: e.idempotencyKey,
    prevHash: e.prevHash,
    hash: e.hash,
  };
}

module.exports = { serializeEvent };
