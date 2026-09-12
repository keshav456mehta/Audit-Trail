const express = require('express');
const EventStore = require('../models/EventStore');

const shipmentCommandsRouter = express.Router();

shipmentCommandsRouter.post('/move', async (req, res) => {
  const { aggregateId, shipmentId } = req.body;
  const eventAggregateId = aggregateId || shipmentId;

  if (!eventAggregateId) {
    return res.status(400).json({
      success: false,
      message: 'aggregateId or shipmentId is required',
    });
  }

  try {
    const event = await EventStore.create({
      aggregateId: eventAggregateId,
      eventType: 'ShipmentMoved',
      payload: req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'Shipment move event recorded',
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
