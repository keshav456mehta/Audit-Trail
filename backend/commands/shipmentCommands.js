const express = require('express');

const shipmentCommandsRouter = express.Router();

shipmentCommandsRouter.post('/move', (req, res) => {
  console.log('Shipment move event received:', req.body);

  res.status(200).json({
    success: true,
    message: 'Event received',
  });
});

module.exports = shipmentCommandsRouter;
