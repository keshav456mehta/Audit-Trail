const express = require('express');
const EventStore = require('../models/EventStore');

const shipmentCommandsRouter = express.Router();
const DUPLICATE_EVENT_WINDOW_MS = 5_000;
const VERSION_RETRY_LIMIT = 3;
const ALLOWED_EVENT_TYPES = EventStore.schema.path('eventType').enumValues;

shipmentCommandsRouter.post('/move', async (req, res) => {
  const { aggregateId, eventType, payload } = req.body || {};

  // Validate the request before querying MongoDB so malformed commands fail fast.
  if (aggregateId !== undefined && typeof aggregateId !== 'string') {
    return res.status(400).json({
      error: 'aggregateId must be a string',
    });
  }

  if (!aggregateId || typeof eventType !== 'string' || !eventType.trim()) {
    return res.status(400).json({
      error: 'aggregateId and eventType are required',
    });
  }

  if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
    return res.status(400).json({
      error: `eventType must be one of: ${ALLOWED_EVENT_TYPES.join(', ')}`,
    });
  }

  if (payload === undefined || payload === null) {
    return res.status(400).json({
      error: 'payload is required',
    });
  }

  try {
    // Reject an identical event for this shipment and event type within the short retry window.
    const duplicateCutoff = new Date(Date.now() - DUPLICATE_EVENT_WINDOW_MS);
    const recentEvents = await EventStore.find({
      aggregateId,
      eventType,
      timestamp: { $gte: duplicateCutoff },
    });

    const payloadStr = JSON.stringify(payload);
    const duplicateEvent = recentEvents.find(
      (e) => JSON.stringify(e.payload) === payloadStr,
    );

    if (duplicateEvent) {
      return res.status(409).json({
        error: 'Duplicate event detected',
      });
    }

    let event;
    for (let attempt = 0; attempt < VERSION_RETRY_LIMIT; attempt += 1) {
      const latestEvent = await EventStore.findOne(
        { aggregateId },
        null,
        { sort: { version: -1 } },
      );

      try {
        event = await EventStore.create({
          aggregateId,
          eventType,
          payload,
          timestamp: new Date(),
          version: (latestEvent?.version || 0) + 1,
        });
        break;
      } catch (error) {
        if (error?.code !== 11000 || attempt === VERSION_RETRY_LIMIT - 1) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Shipment event recorded',
      event,
    });
  } catch (error) {
    console.error('POST /shipment/move failed', {
      timestamp: new Date().toISOString(),
      aggregateId,
      eventType,
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to record shipment move event',
    });
  }
});

module.exports = shipmentCommandsRouter;
