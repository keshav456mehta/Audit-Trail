const mongoose = require('mongoose');
const { ALL_EVENT_TYPES } = require('../domain/shipment');
const { ImmutableEventError } = require('../errors');

/**
 * Append-only event log.
 *
 *  aggregateId     which shipment the event belongs to
 *  eventType       what happened (enum)
 *  payload         event data
 *  timestamp       when the event was recorded (server clock)
 *  version         1..N position inside the aggregate (unique per aggregate)
 *  idempotencyKey  client retry key, unique per aggregate
 *  prevHash/hash   SHA-256 hash chain; editing any stored event is detectable
 *
 * Immutability is enforced in layers (see docs/ARCHITECTURE.md):
 *   1. every field is `immutable`,
 *   2. every Mongoose update/delete/replace/bulk operation throws,
 *   3. production uses a MongoDB role that has no update/remove privilege
 *      (scripts/mongo-appender-role.js),
 *   4. the hash chain makes any out-of-band tampering detectable.
 */
const eventSchema = new mongoose.Schema(
  {
    aggregateId: { type: String, required: true, immutable: true, trim: true, maxlength: 64 },
    eventType: { type: String, required: true, immutable: true, enum: ALL_EVENT_TYPES },
    payload: { type: mongoose.Schema.Types.Mixed, required: true, immutable: true },
    timestamp: { type: Date, required: true, immutable: true, default: Date.now },
    version: { type: Number, required: true, immutable: true, min: 1, validate: Number.isInteger },
    idempotencyKey: { type: String, required: true, immutable: true, maxlength: 128 },
    prevHash: { type: String, required: true, immutable: true },
    hash: { type: String, required: true, immutable: true },
  },
  { versionKey: false, strict: 'throw', minimize: false },
);

eventSchema.index({ aggregateId: 1, version: 1 }, { unique: true });
eventSchema.index({ aggregateId: 1, idempotencyKey: 1 }, { unique: true });
eventSchema.index({ timestamp: 1 });

const BLOCKED_QUERY_OPERATIONS = [
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'findOneAndDelete',
  'deleteOne',
  'deleteMany',
];

for (const operation of BLOCKED_QUERY_OPERATIONS) {
  eventSchema.pre(operation, function blockQueryMutation() {
    throw new ImmutableEventError(operation);
  });
  // document-level variants, e.g. doc.deleteOne() / doc.updateOne()
  if (operation === 'updateOne' || operation === 'deleteOne') {
    eventSchema.pre(operation, { document: true, query: false }, function blockDocumentMutation() {
      throw new ImmutableEventError(`document.${operation}`);
    });
  }
}

eventSchema.pre('bulkWrite', function blockBulkWrite() {
  throw new ImmutableEventError('bulkWrite');
});

eventSchema.pre('save', function blockResave() {
  if (!this.isNew) throw new ImmutableEventError('save (on an existing event)');
});

module.exports = mongoose.models.EventStore || mongoose.model('EventStore', eventSchema);
