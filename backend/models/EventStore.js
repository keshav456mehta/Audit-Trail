const mongoose = require("mongoose");
/*
 * Event Store Fields:
 *
 * aggregateId: Identifies the aggregate/entity this event belongs to.
 * eventType: Defines the type of event that occurred.
 * payload: Stores the data associated with the event.
 * timestamp: Records when the event occurred.
 * version: Tracks the version of the aggregate for future
 *           event ordering and concurrency handling.
 */

const eventSchema = new mongoose.Schema({
  aggregateId: {
    type: String,
    required: true,
  },

  eventType: {
    type: String,
    required: true,
  },

  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },

  version: {
    type: Number,
    default: 1,
  },
});

module.exports = mongoose.model("EventStore", eventSchema);