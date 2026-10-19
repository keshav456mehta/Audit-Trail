const express = require('express');
const ShipmentReadModel = require('../models/ShipmentReadModel');
const { authenticate, requireRole } = require('../middleware/auth');
const { LIFECYCLE_STATUSES } = require('../domain/shipment');

const router = express.Router();

// Aggregation pipelines over the read model: shipments per status, and total temperature spikes.
// Two simple single-accumulator pipelines (instead of one combined $group) so results are identical on MongoDB
// and on MongoDB-compatible servers.
router.get('/shipments', authenticate, requireRole('viewer'), async (_req, res) => {
  const [perStatus, spikeTotals] = await Promise.all([
    ShipmentReadModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ShipmentReadModel.aggregate([{ $group: { _id: null, spikes: { $sum: '$spikeCount' } } }]),
  ]);
  const byStatus = Object.fromEntries(LIFECYCLE_STATUSES.map((s) => [s, 0]));
  let total = 0;
  for (const row of perStatus) {
    byStatus[row._id] = row.count;
    total += row.count;
  }
  res.json({ success: true, total, spikes: spikeTotals[0]?.spikes ?? 0, byStatus });
});

module.exports = router;
