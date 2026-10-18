# API

All routes except `/health` and `/auth/login` need `Authorization: Bearer <token>`.
Every response has `success: true|false`; errors look like `{ "success": false, "error": { "code", "message", "details?" } }`.

| Method & path | Role | Purpose |
| --- | --- | --- |
| `POST /auth/login` | – | `{username, password}` → `{token, user}` |
| `GET /auth/me` | any | current user |
| `POST /shipment/move` | operator | append an event (command) |
| `GET /shipment` | viewer | list from the read model. Query: `status`, `q` (id prefix), `page`, `limit` |
| `GET /shipment/:id` | viewer | state + full history. Query: `version=N` or `asOf=<ISO>` for time travel |
| `GET /shipment/:id/metrics` | viewer | temperature series, spikes, lifecycle markers |
| `GET /shipment/:id/verify` | viewer | hash-chain verification |
| `GET /stats/shipments` | viewer | counts per status + total spikes (aggregation pipelines) |
| `POST /admin/projections/rebuild` | admin | rebuild the read model from the event log |
| `GET /health` | – | liveness + database status |

## `POST /shipment/move`

```json
{
  "aggregateId": "CONT-1042",
  "eventType": "ShipmentTemperatureSpike",
  "payload": { "temperature": 9.8, "threshold": 8 },
  "expectedVersion": 6,
  "idempotencyKey": "optional-unique-retry-key"
}
```

`expectedVersion` is **required**: the version you last loaded (`0` for a new shipment).

| Status | Code | Meaning |
| --- | --- | --- |
| 201 | – | recorded |
| 200 | – | `replayed: true`: this `idempotencyKey` was already recorded |
| 400 | `EXPECTED_VERSION_REQUIRED`, `UNKNOWN_EVENT_TYPE`, `INVALID_ID`, `PAYLOAD_*`, `INVALID_JSON` | malformed request |
| 401 / 403 | `UNAUTHENTICATED`, `INVALID_TOKEN` / `FORBIDDEN` | auth |
| 409 | `VERSION_CONFLICT` (`details.currentVersion`), `IDEMPOTENCY_KEY_REUSED` | someone else wrote first / key reused for a different event |
| 413 | `PAYLOAD_TOO_LARGE` | body over 16 kB |
| 422 | `INVALID_TRANSITION` (`details.allowedNext`), `INVALID_PAYLOAD` | domain rule violated |
| 429 | `RATE_LIMITED`, `TOO_MANY_ATTEMPTS` | slow down |

Event types and payloads:

| eventType | payload |
| --- | --- |
| `ShipmentCreated` | `{ origin (required), destination? }` |
| `ShipmentPacked` | any object |
| `ShipmentShipped` | `{ vessel? }` |
| `ShipmentArrivedAtPort` | any object |
| `ShipmentDelivered` | any object |
| `ShipmentTemperatureRecorded` | `{ temperature }` (-100..100 °C) |
| `ShipmentTemperatureSpike` | `{ temperature, threshold }` with `temperature > threshold` |

## `GET /shipment/:id`

```json
{
  "success": true,
  "shipmentId": "CONT-1042",
  "latestVersion": 7,
  "isHistorical": false,
  "requested": null,
  "currentState": { "status": "SHIPPED", "version": 7, "maxTemperature": 9.8, "spikeCount": 1, "allowedNext": ["..."] },
  "count": 7,
  "events": [{ "version": 1, "eventType": "ShipmentCreated", "payload": {}, "timestamp": "…", "prevHash": "…", "hash": "…" }]
}
```

404 `SHIPMENT_NOT_FOUND` for an unknown shipment. `?asOf=` earlier than the first event returns `currentState.exists: false`.
