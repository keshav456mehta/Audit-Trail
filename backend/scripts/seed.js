/* Seeds demo users and three demo shipments through the real write path. Safe to re-run (idempotent). */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const EventStore = require('../models/EventStore');
const ShipmentReadModel = require('../models/ShipmentReadModel');
const { appendEvent } = require('../services/eventAppender');
const { ProjectionWorker } = require('../projections/shipmentProjection');
const { EVENT_TYPES: T } = require('../domain/shipment');

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY);

const DEV_PASSWORDS = { admin: 'admin-pass-123', operator: 'operator-pass-123', viewer: 'viewer-pass-123' };

async function seedUsers() {
  const created = [];
  for (const role of ['admin', 'operator', 'viewer']) {
    const password = process.env[`SEED_${role.toUpperCase()}_PASSWORD`] || (config.isProduction ? null : DEV_PASSWORDS[role]);
    if (!password) {
      console.warn(`Skipping ${role}: set SEED_${role.toUpperCase()}_PASSWORD to seed it in production`);
      continue;
    }
    if (await User.exists({ username: role })) continue;
    await User.create({ username: role, role, passwordHash: await bcrypt.hash(password, 12) });
    created.push(role);
  }
  return created;
}

const DEMO = {
  'CONT-DEMO-001': [
    [T.CREATED, { origin: 'Mumbai Port', destination: 'Rotterdam' }, 6],
    [T.PACKED, { packer: 'Dock 4' }, 5.5],
    [T.SHIPPED, { vessel: 'MSC Aurora' }, 5],
    [T.TEMPERATURE_RECORDED, { temperature: 4.2 }, 4.5],
    [T.TEMPERATURE_RECORDED, { temperature: 5.1 }, 4],
    [T.TEMPERATURE_RECORDED, { temperature: 6.3 }, 3.5],
    [T.TEMPERATURE_SPIKE, { temperature: 9.8, threshold: 8 }, 3],
    [T.TEMPERATURE_RECORDED, { temperature: 6.0 }, 2.5],
    [T.TEMPERATURE_RECORDED, { temperature: 4.8 }, 2],
    [T.ARRIVED_AT_PORT, { port: 'Port of Rotterdam' }, 1.5],
    [T.DELIVERED, { signedBy: 'Receiving Clerk' }, 1],
  ],
  'CONT-DEMO-002': [
    [T.CREATED, { origin: 'Chennai Port', destination: 'Singapore' }, 3],
    [T.PACKED, {}, 2.5],
    [T.SHIPPED, { vessel: 'Maersk Elba' }, 2],
    [T.TEMPERATURE_RECORDED, { temperature: 3.9 }, 1.5],
    [T.TEMPERATURE_RECORDED, { temperature: 4.4 }, 0.5],
  ],
  'CONT-DEMO-003': [[T.CREATED, { origin: 'Kolkata Port', destination: 'Colombo' }, 0.2]],
};

async function seedShipments() {
  for (const [aggregateId, steps] of Object.entries(DEMO)) {
    for (let i = 0; i < steps.length; i += 1) {
      const [eventType, payload, daysAgo] = steps[i];
      await appendEvent({
        aggregateId,
        eventType,
        payload,
        expectedVersion: i,
        idempotencyKey: `seed:${aggregateId}:${i + 1}`,
        occurredAt: ago(daysAgo),
      });
    }
  }
}

async function main() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([EventStore.init(), ShipmentReadModel.init(), User.init()]);

  const users = await seedUsers();
  await seedShipments();
  await new ProjectionWorker().flush();

  console.log(`Seeded ${Object.keys(DEMO).length} demo shipments${users.length ? ` and users: ${users.join(', ')}` : ''}.`);
  if (users.length && !config.isProduction) {
    console.log('Demo logins (development only):', users.map((u) => `${u} / ${DEV_PASSWORDS[u]}`).join(', '));
  }
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
