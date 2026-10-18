const crypto = require('node:crypto');

// prevHash of the first event in every aggregate.
const GENESIS_HASH = '0'.repeat(64);

/** Deterministic JSON: object keys sorted, undefined dropped, Dates as ISO strings. */
function canonicalize(value) {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function computeEventHash({ aggregateId, version, eventType, payload, timestamp, prevHash }) {
  const body = canonicalize({
    aggregateId,
    version,
    eventType,
    payload,
    timestamp: new Date(timestamp).toISOString(),
    prevHash,
  });
  return crypto.createHash('sha256').update(body).digest('hex');
}

/**
 * Verifies versions are contiguous (1..N), every prevHash points at the
 * previous event, and every stored hash matches a fresh recomputation.
 * Editing, reordering or removing a middle event is therefore detectable.
 */
function verifyChain(events) {
  const sorted = [...events].sort((a, b) => a.version - b.version);
  let previousHash = GENESIS_HASH;

  for (let i = 0; i < sorted.length; i += 1) {
    const event = sorted[i];
    const expectedVersion = i + 1;

    if (event.version !== expectedVersion) {
      return { valid: false, checked: i, brokenAtVersion: expectedVersion, reason: 'VERSION_GAP_OR_DUPLICATE' };
    }
    if (event.prevHash !== previousHash) {
      return { valid: false, checked: i, brokenAtVersion: event.version, reason: 'PREVIOUS_HASH_MISMATCH' };
    }
    if (computeEventHash(event) !== event.hash) {
      return { valid: false, checked: i, brokenAtVersion: event.version, reason: 'EVENT_CONTENT_MODIFIED' };
    }
    previousHash = event.hash;
  }

  return {
    valid: true,
    checked: sorted.length,
    headVersion: sorted.length,
    headHash: sorted.length ? previousHash : null,
  };
}

module.exports = { GENESIS_HASH, canonicalize, computeEventHash, verifyChain };
