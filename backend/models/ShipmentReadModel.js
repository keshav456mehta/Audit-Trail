const mongoose = require('mongoose');
const { LIFECYCLE_STATUSES } = require('../domain/shipment');

/** Denormalised, query-optimised view built by the projection worker. Safe to drop and rebuild. */
const readModelSchema = new mongoose.Schema(
  {
    shipmentId: { type: String, required: true, unique: true },
    status: { type: String, enum: LIFECYCLE_STATUSES, required: true, index: true },
    version: { type: Number, required: true },
    eventCount: { type: Number, required: true },
    origin: String,
    destination: String,
    vessel: String,
    currentTemperature: Number,
    maxTemperature: Number,
    spikeCount: { type: Number, default: 0 },
    createdAt: Date,
    lastEventAt: { type: Date, index: true },
    lastHash: String,
  },
  { versionKey: false, collection: 'shipment_read_models' },
);

module.exports = mongoose.models.ShipmentReadModel || mongoose.model('ShipmentReadModel', readModelSchema);
