const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { startHarness } = require('./helpers');
const EventStore = require('../models/EventStore');
const ShipmentReadModel = require('../models/ShipmentReadModel');
const { appendEvent } = require('../services/eventAppender');
const { EVENT_TYPES: T } = require('../domain/shipment');

let h;
before(async () => { h = await startHarness(); });
after(async () => { await h.stop(); });

let counter = 0;
const newId = (prefix = 'SHIP') => `${prefix}-${Date.now()}-${counter += 1}`;
const get = (path, token = h.tokens.viewer) => h.request('GET', path, { token });

/** Creates a shipment and advances it through `steps` via the real HTTP API. */
async function createShipment(id, steps = []) {
  let version = 0;
  const first = await h.move({ aggregateId: id, eventType: T.CREATED, expectedVersion: version, payload: { origin: 'Mumbai', destination: 'Rotterdam' } });
  assert.equal(first.status, 201, JSON.stringify(first.json));
  version += 1;
  for (const [eventType, payload] of steps) {
    const r = await h.move({ aggregateId: id, eventType, expectedVersion: version, payload });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    version += 1;
  }
  return version;
}

describe('authentication and roles', () => {
  it('rejects requests without a token', async () => {
    assert.equal((await h.request('GET', '/shipment/anything')).status, 401);
    assert.equal((await h.request('POST', '/shipment/move', { body: {} })).status, 401);
  });

  it('rejects garbage, wrongly-signed, expired and alg=none tokens', async () => {
    assert.equal((await get('/shipment/x', 'garbage')).status, 401);
    const forged = jwt.sign({ sub: 'x', role: 'admin' }, 'some-other-secret-some-other-secret-12');
    assert.equal((await get('/shipment/x', forged)).status, 401);
    const expired = jwt.sign({ sub: 'x', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: -10 });
    assert.equal((await get('/shipment/x', expired)).status, 401);
    const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"x","role":"admin"}').toString('base64url')}.`;
    assert.equal((await get('/shipment/x', unsigned)).status, 401);
  });

  it('viewers can read but cannot write; operators cannot use admin routes', async () => {
    const id = newId();
    const denied = await h.move({ aggregateId: id, eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' } }, h.tokens.viewer);
    assert.equal(denied.status, 403);
    assert.equal(denied.json.error.code, 'FORBIDDEN');
    assert.equal((await h.request('POST', '/admin/projections/rebuild', { token: h.tokens.operator })).status, 403);
    assert.equal((await h.request('POST', '/admin/projections/rebuild', { token: h.tokens.viewer })).status, 403);
  });

  it('login: success, wrong password, unknown user, malformed body', async () => {
    const ok = await h.request('POST', '/auth/login', { body: { username: 'Operator', password: 'operator-pw' } });
    assert.equal(ok.status, 200);
    assert.ok(ok.json.token);
    assert.equal(ok.json.user.role, 'operator');
    assert.equal((await h.request('GET', '/auth/me', { token: ok.json.token })).json.user.username, 'operator');
    assert.equal((await h.request('POST', '/auth/login', { body: { username: 'operator', password: 'nope' } })).status, 401);
    assert.equal((await h.request('POST', '/auth/login', { body: { username: 'ghost', password: 'nope' } })).status, 401);
    assert.equal((await h.request('POST', '/auth/login', { body: { username: { $ne: '' }, password: { $ne: '' } } })).status, 400);
  });
});

describe('POST /shipment/move - validation (400)', () => {
  const base = { eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' } };
  const cases = {
    'missing aggregateId': { ...base },
    'aggregateId with illegal characters': { ...base, aggregateId: 'a b/../c' },
    'numeric aggregateId': { ...base, aggregateId: 123 },
    'object aggregateId (NoSQL injection attempt)': { ...base, aggregateId: { $ne: null } },
    'over-long aggregateId': { ...base, aggregateId: 'x'.repeat(65) },
    'missing eventType': { aggregateId: 'v1', expectedVersion: 0, payload: {} },
    'blank eventType': { aggregateId: 'v1', eventType: '  ', expectedVersion: 0, payload: {} },
    'unsupported eventType': { aggregateId: 'v1', eventType: 'ShipmentCancelled', expectedVersion: 0, payload: {} },
    'missing payload': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0 },
    'null payload': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0, payload: null },
    'array payload': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0, payload: [] },
    'string payload': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0, payload: 'x' },
    'missing expectedVersion': { aggregateId: 'v1', eventType: T.CREATED, payload: { origin: 'A' } },
    'string expectedVersion': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: '0', payload: { origin: 'A' } },
    'negative expectedVersion': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: -1, payload: { origin: 'A' } },
    'fractional expectedVersion': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0.5, payload: { origin: 'A' } },
    'bad idempotencyKey': { aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' }, idempotencyKey: 'has spaces' },
  };
  for (const [name, body] of Object.entries(cases)) {
    it(`rejects ${name}`, async () => {
      const r = await h.move(body);
      assert.equal(r.status, 400, JSON.stringify(r.json));
      assert.equal(r.json.success, false);
      assert.ok(r.json.error.code);
    });
  }

  it('rejects an empty body, invalid JSON and an oversized body', async () => {
    assert.equal((await h.request('POST', '/shipment/move', { token: h.tokens.operator, body: {} })).status, 400);
    const badJson = await h.request('POST', '/shipment/move', { token: h.tokens.operator, raw: '{oops', headers: { 'Content-Type': 'application/json' } });
    assert.equal(badJson.status, 400);
    assert.equal(badJson.json.error.code, 'INVALID_JSON');
    const huge = await h.move({ aggregateId: 'v1', eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'x'.repeat(20_000) } });
    assert.equal(huge.status, 413);
  });

  it('writes nothing when validation fails', async () => {
    assert.equal(await EventStore.countDocuments({ aggregateId: 'v1' }), 0);
  });
});

describe('POST /shipment/move - domain rules (422)', () => {
  it('first event must be ShipmentCreated', async () => {
    const r = await h.move({ aggregateId: newId(), eventType: T.DELIVERED, expectedVersion: 0, payload: {} });
    assert.equal(r.status, 422);
    assert.equal(r.json.error.code, 'INVALID_TRANSITION');
    assert.deepEqual(r.json.error.details.allowedNext, [T.CREATED]);
  });

  it('cannot create twice, skip a stage, go backwards, or continue after delivery', async () => {
    const id = newId();
    await createShipment(id);
    const dup = await h.move({ aggregateId: id, eventType: T.CREATED, expectedVersion: 1, payload: { origin: 'A' } });
    assert.equal(dup.status, 422);
    const skip = await h.move({ aggregateId: id, eventType: T.SHIPPED, expectedVersion: 1, payload: {} });
    assert.equal(skip.status, 422);
    assert.ok(skip.json.error.details.allowedNext.includes(T.PACKED));

    for (const [i, type] of [T.PACKED, T.SHIPPED, T.DELIVERED].entries()) {
      assert.equal((await h.move({ aggregateId: id, eventType: type, expectedVersion: i + 1, payload: {} })).status, 201);
    }
    assert.equal((await h.move({ aggregateId: id, eventType: T.PACKED, expectedVersion: 4, payload: {} })).status, 422);
    assert.equal((await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 4, payload: { temperature: 3 } })).status, 422);
    assert.equal((await get(`/shipment/${id}`)).json.currentState.status, 'DELIVERED');
  });

  it('validates payloads per event type', async () => {
    const id = newId();
    assert.equal((await h.move({ aggregateId: id, eventType: T.CREATED, expectedVersion: 0, payload: {} })).status, 422);
    await createShipment(id);
    assert.equal((await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 1, payload: { temperature: 'hot' } })).status, 422);
    assert.equal((await h.move({ aggregateId: id, eventType: T.TEMPERATURE_SPIKE, expectedVersion: 1, payload: { temperature: 5, threshold: 8 } })).status, 422);
  });

  it('a rejected command appends nothing', async () => {
    const id = newId();
    await h.move({ aggregateId: id, eventType: T.DELIVERED, expectedVersion: 0, payload: {} });
    assert.equal(await EventStore.countDocuments({ aggregateId: id }), 0);
  });
});

describe('optimistic concurrency control', () => {
  it('rejects a stale expectedVersion with 409 and reports the current version', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}]]); // now at version 2
    const stale = await h.move({ aggregateId: id, eventType: T.SHIPPED, expectedVersion: 1, payload: {} });
    assert.equal(stale.status, 409);
    assert.equal(stale.json.error.code, 'VERSION_CONFLICT');
    assert.equal(stale.json.error.details.currentVersion, 2);
    assert.equal(await EventStore.countDocuments({ aggregateId: id }), 2);
  });

  it('rejects a version from the future', async () => {
    const id = newId();
    await createShipment(id);
    assert.equal((await h.move({ aggregateId: id, eventType: T.PACKED, expectedVersion: 5, payload: {} })).status, 409);
  });

  it('under a 12-way race exactly one writer wins and history stays gap-free', async () => {
    const id = newId();
    await createShipment(id);
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 1, payload: { temperature: i } })),
    );
    const codes = results.map((r) => r.status).sort();
    assert.equal(codes.filter((c) => c === 201).length, 1, `statuses: ${codes}`);
    assert.equal(codes.filter((c) => c === 409).length, 11, `statuses: ${codes}`);

    const stream = await EventStore.find({ aggregateId: id }).sort({ version: 1 }).lean();
    assert.deepEqual(stream.map((e) => e.version), [1, 2]);
    assert.equal((await get(`/shipment/${id}/verify`)).json.valid, true);
  });

  it('after a conflict the client can reload and succeed', async () => {
    const id = newId();
    await createShipment(id);
    await h.move({ aggregateId: id, eventType: T.PACKED, expectedVersion: 1, payload: {} });
    const conflict = await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 1, payload: { temperature: 3 } });
    assert.equal(conflict.status, 409);
    const retry = await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: conflict.json.error.details.currentVersion, payload: { temperature: 3 } });
    assert.equal(retry.status, 201);
    assert.equal(retry.json.event.version, 3);
  });

  it('parallel writers to different shipments do not interfere', async () => {
    const ids = Array.from({ length: 6 }, () => newId('PAR'));
    const results = await Promise.all(ids.map((aggregateId) => h.move({ aggregateId, eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' } })));
    assert.ok(results.every((r) => r.status === 201));
  });
});

describe('idempotency', () => {
  it('replaying the same key returns the original event and appends nothing', async () => {
    const id = newId();
    const body = { aggregateId: id, eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' }, idempotencyKey: `k-${id}` };
    const first = await h.move(body);
    const second = await h.move(body);
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.equal(second.json.replayed, true);
    assert.equal(second.json.event.id, first.json.event.id);
    assert.equal(await EventStore.countDocuments({ aggregateId: id }), 1);
  });

  it('reusing a key for a different event is refused', async () => {
    const id = newId();
    await h.move({ aggregateId: id, eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' }, idempotencyKey: `k-${id}` });
    const clash = await h.move({ aggregateId: id, eventType: T.PACKED, expectedVersion: 1, payload: {}, idempotencyKey: `k-${id}` });
    assert.equal(clash.status, 409);
    assert.equal(clash.json.error.code, 'IDEMPOTENCY_KEY_REUSED');
  });

  it('5 concurrent retries of one command produce exactly one event', async () => {
    const id = newId();
    const body = { aggregateId: id, eventType: T.CREATED, expectedVersion: 0, payload: { origin: 'A' }, idempotencyKey: `race-${id}` };
    const results = await Promise.all(Array.from({ length: 5 }, () => h.move(body)));
    assert.ok(results.every((r) => r.status === 201 || r.status === 200), results.map((r) => r.status).join());
    assert.equal(await EventStore.countDocuments({ aggregateId: id }), 1);
  });

  it('identical sensor readings are NOT rejected as duplicates (no time-window guessing)', async () => {
    const id = newId();
    await createShipment(id);
    assert.equal((await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 1, payload: { temperature: 4 } })).status, 201);
    assert.equal((await h.move({ aggregateId: id, eventType: T.TEMPERATURE_RECORDED, expectedVersion: 2, payload: { temperature: 4 } })).status, 201);
  });
});

describe('immutability of the event store', () => {
  let id;
  let snapshot;
  before(async () => {
    id = newId('IMM');
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, { vessel: 'MSC Aurora' }]]);
    snapshot = JSON.stringify(await EventStore.collection.find({ aggregateId: id }).sort({ version: 1 }).toArray());
  });
  const rejects = (label, fn) =>
    it(`blocks ${label}`, async () => {
      await assert.rejects(fn, (e) => e.code === 'EVENT_STORE_IMMUTABLE', `${label} should throw EVENT_STORE_IMMUTABLE`);
    });

  rejects('Model.updateOne', () => EventStore.updateOne({ aggregateId: id }, { $set: { eventType: T.DELIVERED } }));
  rejects('Model.updateMany', () => EventStore.updateMany({ aggregateId: id }, { $set: { payload: {} } }));
  rejects('Model.replaceOne', () => EventStore.replaceOne({ aggregateId: id, version: 1 }, { aggregateId: id }));
  rejects('Model.findOneAndUpdate', () => EventStore.findOneAndUpdate({ aggregateId: id }, { $set: { payload: {} } }));
  rejects('Model.findOneAndReplace', () => EventStore.findOneAndReplace({ aggregateId: id }, { aggregateId: id }));
  rejects('Model.findOneAndDelete', () => EventStore.findOneAndDelete({ aggregateId: id }));
  rejects('Model.deleteOne', () => EventStore.deleteOne({ aggregateId: id }));
  rejects('Model.deleteMany', () => EventStore.deleteMany({ aggregateId: id }));
  rejects('Model.bulkWrite', () => EventStore.bulkWrite([{ deleteOne: { filter: { aggregateId: id } } }]));
  it('blocks document.save() with a changed field (immutable-field validation)', async () => {
    const doc = await EventStore.findOne({ aggregateId: id, version: 1 });
    doc.payload = { origin: 'Hacked' };
    doc.markModified('payload');
    await assert.rejects(() => doc.save());
  });
  rejects('document.save() on any stored event, even unchanged', async () => (await EventStore.findOne({ aggregateId: id, version: 1 })).save());
  rejects('document.deleteOne()', async () => (await EventStore.findOne({ aggregateId: id })).deleteOne());

  it('left every stored event byte-for-byte unchanged', async () => {
    const after = JSON.stringify(await EventStore.collection.find({ aggregateId: id }).sort({ version: 1 }).toArray());
    assert.equal(after, snapshot);
  });

  it('exposes no update or delete HTTP routes', async () => {
    for (const method of ['PUT', 'PATCH', 'DELETE']) {
      const r = await h.request(method, `/shipment/${id}`, { token: h.tokens.admin });
      assert.equal(r.status, 404, method);
    }
  });
});

describe('tamper detection (hash chain)', () => {
  it('a clean shipment verifies', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}]]);
    const r = await get(`/shipment/${id}/verify`);
    assert.equal(r.json.valid, true);
    assert.equal(r.json.checked, 2);
  });

  it('detects an event edited directly in the database (bypassing the app)', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, {}], [T.TEMPERATURE_SPIKE, { temperature: 9.9, threshold: 8 }]]);
    await EventStore.collection.updateOne({ aggregateId: id, version: 4 }, { $set: { 'payload.temperature': 3.1 } });
    const r = await get(`/shipment/${id}/verify`);
    assert.equal(r.json.valid, false);
    assert.equal(r.json.reason, 'EVENT_CONTENT_MODIFIED');
    assert.equal(r.json.brokenAtVersion, 4);
  });

  it('detects an event deleted from the middle', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, {}]]);
    await EventStore.collection.deleteOne({ aggregateId: id, version: 2 });
    assert.equal((await get(`/shipment/${id}/verify`)).json.reason, 'VERSION_GAP_OR_DUPLICATE');
  });

  it('detects the LAST event being deleted, via the read model', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, {}]]);
    await h.worker.flush();
    await EventStore.collection.deleteOne({ aggregateId: id, version: 3 });
    const r = await get(`/shipment/${id}/verify`);
    assert.equal(r.json.valid, false);
    assert.equal(r.json.reason, 'EVENTS_MISSING_READ_MODEL_AHEAD');
  });
});

describe('queries (CQRS read side)', () => {
  it('GET /shipment/:id returns state, version and full history in version order', async () => {
    const id = newId();
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, { vessel: 'MSC Aurora' }], [T.TEMPERATURE_RECORDED, { temperature: 4.2 }]]);
    const r = await get(`/shipment/${id}`);
    assert.equal(r.status, 200);
    assert.equal(r.json.success, true);
    assert.equal(r.json.currentState.status, 'SHIPPED');
    assert.equal(r.json.currentState.vessel, 'MSC Aurora');
    assert.equal(r.json.currentState.currentTemperature, 4.2);
    assert.equal(r.json.latestVersion, 4);
    assert.equal(r.json.isHistorical, false);
    assert.equal(r.json.count, 4);
    assert.deepEqual(r.json.events.map((e) => e.version), [1, 2, 3, 4]);
    assert.ok(r.json.currentState.allowedNext.includes(T.ARRIVED_AT_PORT));
  });

  it('an unknown shipment is a 404, not a fake CREATED shipment', async () => {
    const r = await get('/shipment/does-not-exist');
    assert.equal(r.status, 404);
    assert.equal(r.json.error.code, 'SHIPMENT_NOT_FOUND');
  });

  it('rejects malformed ids and does not treat them as queries', async () => {
    assert.equal((await get('/shipment/bad%20id')).status, 400);
    assert.equal((await get('/shipment/%7B%22%24ne%22%3Anull%7D')).status, 400);
  });

  it('time travel by version and by timestamp', async () => {
    const id = newId('TT');
    const stamps = [3, 2.5, 2, 1];
    const steps = [[T.CREATED, { origin: 'A' }], [T.PACKED, {}], [T.SHIPPED, {}], [T.TEMPERATURE_RECORDED, { temperature: 5 }]];
    for (let i = 0; i < steps.length; i += 1) {
      await appendEvent({ aggregateId: id, eventType: steps[i][0], payload: steps[i][1], expectedVersion: i, occurredAt: new Date(Date.now() - stamps[i] * 86_400_000) });
    }
    const v2 = await get(`/shipment/${id}?version=2`);
    assert.equal(v2.json.currentState.status, 'PACKED');
    assert.equal(v2.json.isHistorical, true);
    assert.equal(v2.json.latestVersion, 4);
    assert.equal(v2.json.count, 2);

    const threeDaysAgo = new Date(Date.now() - 2.75 * 86_400_000).toISOString(); // between event 1 and 2
    const asOf = await get(`/shipment/${id}?asOf=${encodeURIComponent(threeDaysAgo)}`);
    assert.equal(asOf.json.currentState.status, 'CREATED');
    assert.equal(asOf.json.count, 1);

    const before = await get(`/shipment/${id}?asOf=2000-01-01T00:00:00Z`);
    assert.equal(before.json.currentState.exists, false);
    assert.equal(before.json.count, 0);

    assert.equal((await get(`/shipment/${id}?version=abc`)).status, 400);
    assert.equal((await get(`/shipment/${id}?version=-1`)).status, 400);
    assert.equal((await get(`/shipment/${id}?asOf=yesterday-ish`)).status, 400);
  });

  it('GET /shipment/:id/metrics returns the temperature series, spikes and markers', async () => {
    const id = newId('MET');
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, {}], [T.TEMPERATURE_RECORDED, { temperature: 4 }], [T.TEMPERATURE_SPIKE, { temperature: 9.5, threshold: 8 }]]);
    const r = await get(`/shipment/${id}/metrics`);
    assert.equal(r.json.points.length, 2);
    assert.equal(r.json.spikes.length, 1);
    assert.equal(r.json.threshold, 8);
    assert.equal(r.json.stats.max, 9.5);
    assert.equal(r.json.markers.length, 3);
  });
});

describe('projection (read model)', () => {
  it('the worker polling path projects events nobody signalled', async () => {
    const id = newId('PRJ');
    await appendEvent({ aggregateId: id, eventType: T.CREATED, payload: { origin: 'Pune' }, expectedVersion: 0 });
    await appendEvent({ aggregateId: id, eventType: T.PACKED, payload: {}, expectedVersion: 1 });
    await h.worker.flush();
    const row = await ShipmentReadModel.findOne({ shipmentId: id }).lean();
    assert.equal(row.status, 'PACKED');
    assert.equal(row.version, 2);
    assert.equal(row.origin, 'Pune');
  });

  it('projecting is idempotent', async () => {
    const id = newId('IDP');
    await createShipment(id, [[T.PACKED, {}]]);
    await h.worker.flush();
    await h.worker.flush();
    assert.equal(await ShipmentReadModel.countDocuments({ shipmentId: id }), 1);
    assert.equal((await ShipmentReadModel.findOne({ shipmentId: id }).lean()).eventCount, 2);
  });

  it('GET /shipment lists from the read model with filter, search and pagination', async () => {
    const tag = `LST${Date.now()}`;
    for (let i = 0; i < 5; i += 1) await createShipment(`${tag}-${i}`, i % 2 ? [[T.PACKED, {}]] : []);
    await h.worker.flush();

    const all = await get(`/shipment?q=${tag}&limit=2&page=1`);
    assert.equal(all.json.total, 5);
    assert.equal(all.json.items.length, 2);
    const page3 = await get(`/shipment?q=${tag}&limit=2&page=3`);
    assert.equal(page3.json.items.length, 1);
    const packed = await get(`/shipment?q=${tag}&status=PACKED`);
    assert.equal(packed.json.total, 2);
    assert.ok(packed.json.items.every((i) => i.status === 'PACKED'));
    assert.equal((await get('/shipment?status=BOGUS')).status, 400);
    assert.equal((await get('/shipment?q=.*')).json.total, 0); // regex metacharacters are escaped
  });

  it('GET /stats/shipments aggregates per status and counts temperature spikes', async () => {
    const spiky = newId('SPK');
    await createShipment(spiky, [[T.PACKED, {}], [T.TEMPERATURE_SPIKE, { temperature: 9.1, threshold: 8 }], [T.TEMPERATURE_SPIKE, { temperature: 9.9, threshold: 8 }]]);
    await h.worker.flush();
    const r = await get('/stats/shipments');
    assert.ok(r.json.spikes >= 2, `spikes should include this shipment's 2, got ${r.json.spikes}`);
    assert.equal(r.status, 200);
    const sum = Object.values(r.json.byStatus).reduce((a, b) => a + b, 0);
    assert.equal(sum, r.json.total);
    assert.ok(r.json.total > 0);
  });

  it('the read model can be wiped and rebuilt exactly from the event log', async () => {
    const tag = `RBD${Date.now()}`;
    for (let i = 0; i < 3; i += 1) await createShipment(`${tag}-${i}`, [[T.PACKED, {}], [T.TEMPERATURE_RECORDED, { temperature: i }]]);
    await h.worker.flush();
    const mine = { shipmentId: { $regex: `^${tag}` } };
    const before = await ShipmentReadModel.find(mine).sort({ shipmentId: 1 }).select('-_id').lean();
    assert.equal(before.length, 3);

    await ShipmentReadModel.collection.deleteMany({});
    const rebuilt = await h.request('POST', '/admin/projections/rebuild', { token: h.tokens.admin });
    assert.equal(rebuilt.status, 200);
    const after = await ShipmentReadModel.find(mine).sort({ shipmentId: 1 }).select('-_id').lean();
    assert.deepEqual(after, before);
  });

  it('a corrupted read-model row heals itself from the stream', async () => {
    const id = newId('HEAL');
    await createShipment(id, [[T.PACKED, {}], [T.SHIPPED, {}]]);
    await h.worker.flush();
    await ShipmentReadModel.collection.updateOne({ shipmentId: id }, { $set: { version: 1, status: 'CREATED' } });
    await h.worker.flush();
    // row was behind the stream, so replaying from its version produces the right row again
    assert.equal((await ShipmentReadModel.findOne({ shipmentId: id }).lean()).status, 'SHIPPED');
  });
});

describe('platform hardening', () => {
  it('serves /health and a JSON 404 for unknown routes', async () => {
    const health = await h.request('GET', '/health');
    assert.equal(health.status, 200);
    assert.equal(health.json.database, 'up');
    const nope = await h.request('GET', '/nope');
    assert.equal(nope.status, 404);
    assert.equal(nope.json.error.code, 'ROUTE_NOT_FOUND');
  });

  it('sets security headers and honours the CORS allow-list', async () => {
    const ok = await h.request('GET', '/health', { headers: { Origin: 'http://allowed.example' } });
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://allowed.example');
    assert.ok(ok.headers.get('x-content-type-options'));
    assert.equal(ok.headers.get('x-powered-by'), null);
    const bad = await h.request('GET', '/health', { headers: { Origin: 'http://evil.example' } });
    assert.equal(bad.status, 403);
  });

  it('never leaks internals in 500s', async () => {
    const original = ShipmentReadModel.countDocuments;
    ShipmentReadModel.countDocuments = () => { throw new Error('secret connection string mongodb://user:pw@host'); };
    try {
      const r = await get('/shipment');
      assert.equal(r.status, 500);
      assert.equal(r.json.error.message, 'Something went wrong');
      assert.ok(!JSON.stringify(r.json).includes('secret'));
    } finally {
      ShipmentReadModel.countDocuments = original;
    }
  });
});
