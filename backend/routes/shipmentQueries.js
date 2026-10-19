const express = require('express');
const EventStore = require('../models/EventStore');
const ShipmentReadModel = require('../models/ShipmentReadModel');
const { authenticate, requireRole } = require('../middleware/auth');
const { assertValidId } = require('../middleware/validate');
const { AppError } = require('../errors');
const { LIFECYCLE_STATUSES, stateAt, describe, buildMetrics, fold } = require('../domain/shipment');
const { verifyChain } = require('../domain/hash');
const { serializeEvent } = require('../services/serializers');

/** CQRS read side: never writes. */
const router = express.Router();
router.use(authenticate, requireRole('viewer'));

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function loadEvents(id) {
  assertValidId(id);
  const events = await EventStore.find({ aggregateId: id }).sort({ version: 1 }).lean();
  if (!events.length) throw new AppError(404, 'SHIPMENT_NOT_FOUND', `No events recorded for shipment "${id}"`);
  return events;
}

function parseTimeTravel(query) {
  const out = {};
  if (query.version !== undefined) {
    const version = Number(query.version);
    if (!Number.isInteger(version) || version < 0) throw new AppError(400, 'INVALID_VERSION', 'version must be an integer >= 0');
    out.version = version;
  }
  if (query.asOf !== undefined) {
    const asOf = new Date(query.asOf);
    if (Number.isNaN(asOf.getTime())) throw new AppError(400, 'INVALID_AS_OF', 'asOf must be an ISO-8601 date-time');
    out.asOf = asOf;
  }
  return out;
}

// Optimised list from the projection (read model) - does not replay event streams.
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = {};

  if (req.query.status !== undefined) {
    if (!LIFECYCLE_STATUSES.includes(req.query.status)) {
      throw new AppError(400, 'INVALID_STATUS', `status must be one of: ${LIFECYCLE_STATUSES.join(', ')}`);
    }
    filter.status = req.query.status;
  }
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    filter.shipmentId = { $regex: `^${escapeRegex(req.query.q.trim().slice(0, 64))}` };
  }

  const [total, rows] = await Promise.all([
    ShipmentReadModel.countDocuments(filter),
    ShipmentReadModel.find(filter).sort({ lastEventAt: -1 }).skip((page - 1) * limit).limit(limit).select('-_id').lean(),
  ]);
  res.json({ success: true, page, limit, total, items: rows });
});

router.get('/:id', async (req, res) => {
  const events = await loadEvents(req.params.id);
  const travel = parseTimeTravel(req.query);
  const latest = events[events.length - 1];

  const { state, events: visible } = Object.keys(travel).length
    ? stateAt(events, travel)
    : { state: fold(events, req.params.id), events };

  res.json({
    success: true,
    shipmentId: req.params.id,
    latestVersion: latest.version,
    isHistorical: state.version < latest.version,
    requested: Object.keys(travel).length ? { version: travel.version ?? null, asOf: travel.asOf?.toISOString() ?? null } : null,
    currentState: describe(state),
    count: visible.length,
    events: visible.map(serializeEvent),
  });
});

router.get('/:id/metrics', async (req, res) => {
  const events = await loadEvents(req.params.id);
  res.json({ success: true, shipmentId: req.params.id, ...buildMetrics(events) });
});

router.get('/:id/verify', async (req, res) => {
  const events = await loadEvents(req.params.id);
  const result = verifyChain(events);

  // The hash chain cannot see events deleted from its tail, but the read model remembers how far the stream had got.
  const row = await ShipmentReadModel.findOne({ shipmentId: req.params.id }).lean();
  if (result.valid && row) {
    if (row.version > result.headVersion) {
      Object.assign(result, { valid: false, reason: 'EVENTS_MISSING_READ_MODEL_AHEAD', brokenAtVersion: result.headVersion + 1 });
    } else if (row.version === result.headVersion && row.lastHash !== result.headHash) {
      Object.assign(result, { valid: false, reason: 'READ_MODEL_HASH_MISMATCH', brokenAtVersion: result.headVersion });
    }
  }
  res.json({ success: true, shipmentId: req.params.id, readModelVersion: row?.version ?? null, ...result });
});

module.exports = router;
