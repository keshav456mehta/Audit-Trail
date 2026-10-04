# Event Store Schema Reference

The Event Store persists one document per shipment event. The current schema is
defined in `backend/models/EventStore.js`.

| Field | Type | Validation or default | Purpose |
| --- | --- | --- | --- |
| `aggregateId` | String | Required | Identifies the shipment aggregate. |
| `eventType` | String | Required; one of `ShipmentCreated`, `ShipmentPacked`, `ShipmentShipped`, or `ShipmentDelivered` | Identifies the event. |
| `payload` | Mixed | Required | Stores event-specific data. |
| `timestamp` | Date | Defaults to the current time | Records when the event was stored. |
| `version` | Number | Defaults to `1` | Orders events for an aggregate and supports version conflict detection. |

## Indexes

- `{ aggregateId: 1 }` supports shipment event lookups.
- `{ timestamp: 1 }` supports time-based queries.
- `{ aggregateId: 1, version: 1 }` is unique, preventing duplicate versions within a shipment.

## Verification

Backend route tests cover required fields, accepted event types, version
increments, and duplicate-version collisions. See
[`backend/DAY12_TEST_RESULTS.md`](backend/DAY12_TEST_RESULTS.md) for the recorded
test results. These checks use a stubbed event store; they do not verify a live
MongoDB deployment.
