const express = require('express');
const EventStore = require('../models/EventStore');

const shipmentCommandsRouter = express.Router();

shipmentCommandsRouter.post('/move', async (req, res) => {
  const { aggregateId, eventType, payload } = req.body;

  if (!aggregateId || !eventType || payload === undefined) {
    return res.status(400).json({
      success: false,
      message: 'aggregateId, eventType, and payload are required',
    });
  }

  try {
    const event = await EventStore.create({
      aggregateId,
      eventType,
      payload,
      timestamp: new Date(),
      version: 1,
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
