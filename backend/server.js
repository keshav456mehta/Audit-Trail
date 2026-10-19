const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const EventStore = require('./models/EventStore');
const ShipmentReadModel = require('./models/ShipmentReadModel');
const User = require('./models/User');
const { ProjectionWorker } = require('./projections/shipmentProjection');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { AppError } = require('./errors');

function createApp({ projectionWorker } = {}) {
  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser clients (curl, Postman, server-to-server) send no Origin header.
        if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new AppError(403, 'CORS_ORIGIN_DENIED', `Origin ${origin} is not allowed`));
      },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: config.rateLimitMax,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', 'Too many requests')),
    }),
  );
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (_req, res) => res.send('Audit Trail backend is running'));
  app.get('/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'degraded', database: connected ? 'up' : 'down' });
  });

  app.use('/auth', require('./routes/auth'));
  // CQRS: commands (write) and queries (read) are separate routers on the same base path.
  app.use('/shipment', require('./routes/shipmentCommands'));
  app.use('/shipment', require('./routes/shipmentQueries'));
  app.use('/stats', require('./routes/stats'));
  if (projectionWorker) app.use('/admin', require('./routes/admin')(projectionWorker));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

async function startServer() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected successfully');
  await Promise.all([EventStore.init(), ShipmentReadModel.init(), User.init()]); // build indexes (incl. unique ones) before serving

  const projectionWorker = new ProjectionWorker({ pollMs: config.projectionPollMs });
  projectionWorker.start();

  const server = createApp({ projectionWorker }).listen(config.port, () => console.log(`Server running on port ${config.port}`));

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    projectionWorker.stop();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  return { server, projectionWorker };
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start:', error);
    process.exit(1);
  });
}

module.exports = { createApp, startServer };
