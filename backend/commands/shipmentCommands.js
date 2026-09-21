const express = require('express');
const EventStore = require('../models/EventStore');

const shipmentCommandsRouter = express.Router();
const DUPLICATE_EVENT_WINDOW_MS = 5_000;
const ALLOWED_EVENT_TYPES = EventStore.schema.path('eventType').enumValues;

shipmentCommandsRouter.post('/move', async (req, res) => {
  const { aggregateId, eventType, payload } = req.body || {};

  if (aggregateId !== undefined && typeof aggregateId !== 'string') {
    return res.status(400).json({
      error: 'aggregateId must be a string',
    });
  }

  if (!aggregateId || !eventType) {
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
    const duplicateCutoff = new Date(Date.now() - DUPLICATE_EVENT_WINDOW_MS);
    const duplicateEvent = await EventStore.findOne({
      aggregateId,
      eventType,
      payload,
      timestamp: { $gte: duplicateCutoff },
    });

    if (duplicateEvent) {
      return res.status(409).json({
        error: 'Duplicate event detected',
      });
    }

    const latestEvent = await EventStore.findOne(
      { aggregateId },
      null,
      { sort: { version: -1 } },
    );

    const event = await EventStore.create({
      aggregateId,
      eventType,
      payload,
      timestamp: new Date(),
      version: (latestEvent?.version || 0) + 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment event recorded',
      event,
    });
  } catch (error) {
    console.error('Failed to record shipment move event:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record shipment move event',
    });
  }
});

module.exports = shipmentCommandsRouter;
