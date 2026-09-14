const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');
const EventStore = require('../models/EventStore');

test('POST /shipment/move records a shipment move event', async (testContext) => {
  const originalCreate = EventStore.create;
  const requestBody = {
    aggregateId: '123',
    eventType: 'CREATED',
    payload: { origin: 'Chennai' },
  };
  const persistedEvent = {
    _id: 'event-1',
    aggregateId: '123',
    eventType: 'CREATED',
    payload: requestBody.payload,
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
    body: JSON.stringify(requestBody),
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Shipment event recorded',
    event: persistedEvent,
  });
  assert.deepEqual(createInput, {
    aggregateId: '123',
    eventType: 'CREATED',
    payload: requestBody.payload,
    timestamp: createInput.timestamp,
    version: 1,
  });
});

for (const [name, body] of [
  ['aggregateId', { eventType: 'CREATED', payload: {} }],
  ['eventType', { aggregateId: '123', payload: {} }],
  ['aggregateId and eventType', { payload: {} }],
]) {
  test(`POST /shipment/move rejects a request missing ${name}`, async (testContext) => {
    const originalCreate = EventStore.create;
    let createCalled = false;
    EventStore.create = async () => {
      createCalled = true;
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
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'aggregateId and eventType are required',
    });
    assert.equal(createCalled, false);
  });
}

for (const [name, body] of [
  ['an empty payload object', { aggregateId: '123', eventType: 'CREATED', payload: {} }],
  ['a numeric aggregate ID', { aggregateId: 123, eventType: 'CREATED', payload: {} }],
  ['a string payload', { aggregateId: '123', eventType: 'CREATED', payload: 'note' }],
  ['an unexpected event type', { aggregateId: '123', eventType: 'BANANA', payload: {} }],
]) {
  test(`POST /shipment/move accepts ${name} without crashing`, async (testContext) => {
    const originalCreate = EventStore.create;
    let createInput;
    EventStore.create = async (input) => {
      createInput = input;
      return input;
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
      body: JSON.stringify(body),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(createInput.aggregateId, body.aggregateId);
    assert.deepEqual(createInput.eventType, body.eventType);
    assert.deepEqual(createInput.payload, body.payload);
  });
}

test('POST /shipment/move rejects an empty request body without crashing', async (testContext) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'aggregateId and eventType are required',
  });
});
