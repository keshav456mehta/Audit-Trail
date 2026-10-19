const mongoose = require('mongoose');

const checkpointSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    lastEventId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { versionKey: false, collection: 'projection_checkpoints' },
);

module.exports = mongoose.models.ProjectionCheckpoint || mongoose.model('ProjectionCheckpoint', checkpointSchema);
