const test = require('node:test');
const assert = require('node:assert/strict');
const d = require('../domain/shipment');
const { GENESIS_HASH, computeEventHash, verifyChain, canonicalize } = require('../domain/hash');

const T = d.EVENT_TYPES;
const at = (n) => new Date(Date.UTC(2026, 8, 1, 0, n)); // n minutes after a fixed instant

/** Builds a correctly chained event list from [eventType, payload] pairs. */
function chain(id, steps) {
  const events = [];
  let prevHash = GENESIS_HASH;
  steps.forEach(([eventType, payload], i) => {
    const e = { aggregateId: id, eventType, payload, timestamp: at(i), version: i + 1, prevHash };
    e.hash = computeEventHash(e);
    prevHash = e.hash;
    events.push(e);
  });
  return events;
}

const LIFECYCLE = [
  [T.CREATED, { origin: 'Mumbai' }],
  [T.PACKED, {}],
  [T.SHIPPED, { vessel: 'MSC Aurora' }],
  [T.TEMPERATURE_RECORDED, { temperature: 4.1 }],
  [T.TEMPERATURE_SPIKE, { temperature: 9.8, threshold: 8 }],
  [T.ARRIVED_AT_PORT, {}],
  [T.DELIVERED, {}],
];

test('fold replays a full lifecycle into the final state', () => {
  const state = d.fold(chain('S1', LIFECYCLE));
  assert.equal(state.status, 'DELIVERED');
  assert.equal(state.version, 7);
  assert.equal(state.origin, 'Mumbai');
  assert.equal(state.vessel, 'MSC Aurora');
  assert.equal(state.maxTemperature, 9.8);
  assert.equal(state.spikeCount, 1);
  assert.equal(state.eventCount, 7);
});

test('fold of no events is a non-existent shipment, not a CREATED one', () => {
  const state = d.fold([], 'GHOST');
  assert.equal(state.exists, false);
  assert.equal(state.status, null);
  assert.equal(state.version, 0);
});

test('fold orders by version even when timestamps tie or are shuffled', () => {
  const events = chain('S2', LIFECYCLE.slice(0, 3)).map((e) => ({ ...e, timestamp: at(0) }));
  const state = d.fold([events[2], events[0], events[1]]);
  assert.equal(state.status, 'SHIPPED');
});

test('apply never mutates the previous state', () => {
  const before = d.initialState('S3');
  const frozen = JSON.stringify(before);
  d.apply(before, chain('S3', LIFECYCLE)[0]);
  assert.equal(JSON.stringify(before), frozen);
});

test('decide: only the legal next events are accepted', () => {
  const empty = d.initialState('S4');
  assert.equal(d.decide(empty, T.DELIVERED, {}).code, 'INVALID_TRANSITION');
  assert.equal(d.decide(empty, T.CREATED, { origin: 'A' }), null);

  const created = d.fold(chain('S4', LIFECYCLE.slice(0, 1)));
  assert.equal(d.decide(created, T.CREATED, { origin: 'A' }).code, 'INVALID_TRANSITION');
  assert.equal(d.decide(created, T.SHIPPED, {}).code, 'INVALID_TRANSITION'); // cannot skip PACKED
  assert.equal(d.decide(created, T.PACKED, {}), null);

  const delivered = d.fold(chain('S4', LIFECYCLE));
  assert.deepEqual(d.allowedNext(delivered), []);
  assert.equal(d.decide(delivered, T.TEMPERATURE_RECORDED, { temperature: 1 }).code, 'INVALID_TRANSITION');
});

test('decide: a status can never move backwards', () => {
  const shipped = d.fold(chain('S5', LIFECYCLE.slice(0, 3)));
  assert.equal(d.decide(shipped, T.PACKED, {}).code, 'INVALID_TRANSITION');
  assert.equal(d.decide(shipped, T.CREATED, { origin: 'A' }).code, 'INVALID_TRANSITION');
});

test('decide: payload rules', () => {
  const created = d.fold(chain('S6', LIFECYCLE.slice(0, 1)));
  assert.equal(d.decide(d.initialState('S6'), T.CREATED, {}).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(d.initialState('S6'), T.CREATED, []).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(created, T.TEMPERATURE_RECORDED, { temperature: '4' }).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(created, T.TEMPERATURE_RECORDED, { temperature: 1000 }).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(created, T.TEMPERATURE_SPIKE, { temperature: 5, threshold: 8 }).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(created, T.TEMPERATURE_SPIKE, { temperature: 9 }).code, 'INVALID_PAYLOAD');
  assert.equal(d.decide(created, 'ShipmentCancelled', {}).code, 'UNKNOWN_EVENT_TYPE');
});

test('stateAt rewinds by version and by time', () => {
  const events = chain('S7', LIFECYCLE);
  assert.equal(d.stateAt(events, { version: 3 }).state.status, 'SHIPPED');
  assert.equal(d.stateAt(events, { version: 3 }).events.length, 3);
  assert.equal(d.stateAt(events, { asOf: at(1) }).state.status, 'PACKED'); // inclusive
  assert.equal(d.stateAt(events, { version: 0 }).state.exists, false);
  assert.equal(d.stateAt(events, { asOf: new Date(0) }).state.exists, false);
  assert.equal(d.stateAt(events, { version: 99 }).state.status, 'DELIVERED');
});

test('buildMetrics separates telemetry from lifecycle markers', () => {
  const m = d.buildMetrics(chain('S8', LIFECYCLE));
  assert.equal(m.points.length, 2);
  assert.equal(m.spikes.length, 1);
  assert.equal(m.threshold, 8);
  assert.equal(m.markers.length, 5);
  assert.deepEqual(m.stats, { count: 2, min: 4.1, max: 9.8, average: 6.95, latest: 9.8 });
  assert.equal(d.buildMetrics([]).stats, null);
});

test('canonicalize is key-order independent', () => {
  assert.equal(canonicalize({ a: 1, b: { d: 2, c: 3 } }), canonicalize({ b: { c: 3, d: 2 }, a: 1 }));
});

test('hash chain: an untouched chain verifies', () => {
  const result = verifyChain(chain('S9', LIFECYCLE));
  assert.equal(result.valid, true);
  assert.equal(result.checked, 7);
});

test('hash chain: editing an event is detected', () => {
  const events = chain('S10', LIFECYCLE);
  events[3].payload = { temperature: 2.0 }; // hide the evidence
  const result = verifyChain(events);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'EVENT_CONTENT_MODIFIED');
  assert.equal(result.brokenAtVersion, 4);
});

test('hash chain: removing a middle event is detected', () => {
  const events = chain('S11', LIFECYCLE);
  events.splice(2, 1);
  const result = verifyChain(events);
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'VERSION_GAP_OR_DUPLICATE');
});

test('hash chain: a re-hashed forgery still breaks the next link', () => {
  const events = chain('S12', LIFECYCLE);
  events[1].payload = { forged: true };
  events[1].hash = computeEventHash(events[1]); // attacker recomputes this one hash...
  const result = verifyChain(events);
  assert.equal(result.valid, false); // ...but event 3's prevHash no longer matches
  assert.equal(result.reason, 'PREVIOUS_HASH_MISMATCH');
});
