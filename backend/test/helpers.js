/* Shared integration-test harness: real HTTP server + real MongoDB-compatible database (no mocks). */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.RATE_LIMIT_MAX = '1000000';
process.env.LOGIN_RATE_LIMIT_MAX = '1000000';
process.env.CORS_ORIGINS = 'http://allowed.example';

const http = require('node:http');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { createApp } = require('../server');
const User = require('../models/User');
const EventStore = require('../models/EventStore');
const ShipmentReadModel = require('../models/ShipmentReadModel');
const { ProjectionWorker } = require('../projections/shipmentProjection');
const { signToken } = require('../middleware/auth');

const BASE_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017';

async function startHarness() {
  const dbName = `audit-trail-test-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  await mongoose.connect(`${BASE_URI}/${dbName}`, { serverSelectionTimeoutMS: 4000 });
  await Promise.all([EventStore.init(), ShipmentReadModel.init(), User.init()]);

  const users = {};
  for (const role of ['viewer', 'operator', 'admin']) {
    users[role] = await User.create({ username: role, role, passwordHash: await bcrypt.hash(`${role}-pw`, 4) });
  }
  const tokens = Object.fromEntries(Object.entries(users).map(([role, user]) => [role, signToken(user)]));

  const worker = new ProjectionWorker({ pollMs: 3_600_000, logger: { error() {} } }); // not auto-started: tests drive it
  const server = http.createServer(createApp({ projectionWorker: worker }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  async function request(method, path, { token, body, headers = {}, raw } = {}) {
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body !== undefined && !raw ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, json, headers: res.headers };
  }

  const move = (body, token = tokens.operator) => request('POST', '/shipment/move', { token, body });

  async function stop() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    await new Promise((resolve) => server.close(resolve));
  }

  return { baseUrl, request, move, tokens, users, worker, stop };
}

module.exports = { startHarness };
