const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');
const EventStore = require('../models/EventStore');

test('POST /shipment/move records a shipment move event', async (testContext) => {
  const originalCreate = EventStore.create;
  const payload = { aggregateId: '123', destination: 'Mumbai' };
  const persistedEvent = {
    _id: 'event-1',
    aggregateId: '123',
    eventType: 'ShipmentMoved',
    payload,
  };
  let createInput;

  EventStore.create = async (input) => {
    createInput = input;
    return persistedEvent;
  };

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => {
    EventStore.create = originalCreate;
    server.close();
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Shipment move event recorded',
    event: persistedEvent,
  });
  assert.deepEqual(createInput, {
    aggregateId: '123',
    eventType: 'ShipmentMoved',
    payload,
  });
});

test('POST /shipment/move requires an aggregate ID', async (testContext) => {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destination: 'Mumbai' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    message: 'aggregateId or shipmentId is required',
  });
});
