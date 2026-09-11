const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../server');

test('POST /shipment/move returns the dummy event response', async (testContext) => {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  testContext.after(() => server.close());

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/shipment/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aggregateId: '123', eventType: 'MOVED' }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Event received',
  });
});
