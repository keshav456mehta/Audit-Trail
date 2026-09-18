const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');
const EventStore = require('../models/EventStore');

test('POST /shipment/move records a shipment move event', async (testContext) => {
  const originalCreate = EventStore.create;
  const originalFindOne = EventStore.findOne;
  const requestBody = {
    aggregateId: '123',
    eventType: 'ShipmentCreated',
    payload: { origin: 'Chennai' },
  };
  const persistedEvent = {
    _id: 'event-1',
    aggregateId: '123',
    eventType: 'ShipmentCreated',
    payload: requestBody.payload,
  };
  let createInput;

  EventStore.create = async (input) => {
    createInput = input;
    return persistedEvent;
  };
  EventStore.findOne = async () => null;

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => {
    EventStore.create = originalCreate;
    EventStore.findOne = originalFindOne;
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
    eventType: 'ShipmentCreated',
    payload: requestBody.payload,
    timestamp: createInput.timestamp,
    version: 1,
  });
});

for (const [name, body] of [
  ['aggregateId', { eventType: 'ShipmentCreated', payload: {} }],
  ['eventType', { aggregateId: '123', payload: {} }],
  ['aggregateId and eventType', { payload: {} }],
]) {
  test(`POST /shipment/move rejects a request missing ${name}`, async (testContext) => {
    const originalCreate = EventStore.create;
    const originalFindOne = EventStore.findOne;
    let createCalled = false;
    EventStore.create = async () => {
      createCalled = true;
    };
    EventStore.findOne = async () => null;

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    testContext.after(() => {
      EventStore.create = originalCreate;
      EventStore.findOne = originalFindOne;
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
  ['an empty payload object', { aggregateId: '123', eventType: 'ShipmentCreated', payload: {} }],
  ['a string payload', { aggregateId: '123', eventType: 'ShipmentCreated', payload: 'note' }],
]) {
  test(`POST /shipment/move accepts ${name} without crashing`, async (testContext) => {
    const originalCreate = EventStore.create;
    const originalFindOne = EventStore.findOne;
    let createInput;
    EventStore.create = async (input) => {
      createInput = input;
      return input;
    };
    EventStore.findOne = async () => null;

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    testContext.after(() => {
      EventStore.create = originalCreate;
      EventStore.findOne = originalFindOne;
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

for (const [name, body] of [
  ['payload omitted entirely', { aggregateId: '123', eventType: 'ShipmentCreated' }],
  ['a null payload', { aggregateId: '123', eventType: 'ShipmentCreated', payload: null }],
]) {
  test(`POST /shipment/move rejects ${name} without crashing`, async (testContext) => {
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
    assert.deepEqual(await response.json(), { error: 'payload is required' });
    assert.equal(createCalled, false);
  });
}

test('POST /shipment/move rejects an eventType outside the schema enum', async (testContext) => {
  const originalCreate = EventStore.create;
  const originalFindOne = EventStore.findOne;
  let createCalled = false;
  let findOneCalled = false;
  EventStore.create = async () => {
    createCalled = true;
  };
  EventStore.findOne = async () => {
    findOneCalled = true;
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => {
    EventStore.create = originalCreate;
    EventStore.findOne = originalFindOne;
    server.close();
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aggregateId: '123',
      eventType: 'ShipmentCancelled',
      payload: {},
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: 'eventType must be one of: ShipmentCreated, ShipmentPacked, ShipmentShipped, ShipmentDelivered',
  });
  assert.equal(createCalled, false);
  assert.equal(findOneCalled, false);
});

for (const [name, aggregateId] of [
  ['a numeric aggregate ID', 123],
  ['an object aggregate ID', {}],
  ['an array aggregate ID', []],
  ['a boolean aggregate ID', true],
]) {
  test(`POST /shipment/move rejects ${name}`, async (testContext) => {
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
      body: JSON.stringify({ aggregateId, eventType: 'ShipmentCreated', payload: {} }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: 'aggregateId must be a string',
    });
    assert.equal(createCalled, false);
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

test('POST /shipment/move rejects a matching recent event as a duplicate', async (testContext) => {
  const originalCreate = EventStore.create;
  const originalFindOne = EventStore.findOne;
  const requestBody = {
    aggregateId: '123',
    eventType: 'ShipmentCreated',
    payload: { origin: 'Chennai' },
  };
  let findOneQuery;
  let createCalled = false;

  EventStore.findOne = async (query) => {
    findOneQuery = query;
    return { _id: 'recent-event' };
  };
  EventStore.create = async () => {
    createCalled = true;
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => {
    EventStore.create = originalCreate;
    EventStore.findOne = originalFindOne;
    server.close();
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'Duplicate event detected' });
  assert.equal(createCalled, false);
  assert.deepEqual(findOneQuery.aggregateId, requestBody.aggregateId);
  assert.deepEqual(findOneQuery.eventType, requestBody.eventType);
  assert.deepEqual(findOneQuery.payload, requestBody.payload);
  assert.ok(findOneQuery.timestamp.$gte instanceof Date);
});

test('POST /shipment/move saves an event when no matching recent event exists', async (testContext) => {
  const originalCreate = EventStore.create;
  const originalFindOne = EventStore.findOne;
  const requestBody = {
    aggregateId: '123',
    eventType: 'ShipmentPacked',
    payload: { origin: 'Chennai' },
  };
  const persistedEvent = { _id: 'event-2', ...requestBody };

  EventStore.findOne = async () => null;
  EventStore.create = async (input) => ({ ...persistedEvent, timestamp: input.timestamp, version: input.version });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => {
    EventStore.create = originalCreate;
    EventStore.findOne = originalFindOne;
    server.close();
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  assert.equal(response.status, 201);
});
