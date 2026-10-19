const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');

module.exports = function adminRouter(projectionWorker) {
  const router = express.Router();
  router.use(authenticate, requireRole('admin'));

  // The read model is disposable: replaying the event log rebuilds it exactly.
  router.post('/projections/rebuild', async (_req, res) => {
    const rebuilt = await projectionWorker.rebuildAll();
    res.json({ success: true, message: 'Read model rebuilt from the event log', shipments: rebuilt });
  });

  return router;
};
