# Day 12: POST /shipment/move Test Results

## Regression pass (Day 21)

The backend regression suite was run with `npm.cmd test` from `backend/` after
the Phase 3 and Day 20 shipment command changes. The suite uses a stubbed
EventStore for route tests, so no MongoDB server is required. Schema validation
is checked directly with Mongoose.

| Area | Coverage | Result |
| --- | --- | --- |
| Event type list | `ShipmentCreated`, `ShipmentPacked`, `ShipmentShipped`, and `ShipmentDelivered`, read from the schema enum | All four save valid payloads with version 1 |
| Required fields | Missing aggregate ID, event type, or both; missing/null payload; direct schema checks for aggregateId, eventType, and payload | Correct 400 responses or required-field validation errors |
| Invalid data | Numeric, object, array, or boolean aggregate ID; enum-external `ShipmentCancelled`; empty request body | Correct 400 responses; no save or version lookup for unsupported event types |
| Payload cases | Empty object and string payload accepted; missing and null payload rejected | Passed |
| Duplicate event | Same aggregate, type, and payload in the recent-event window | Correct 409 response; no save |
| Versioning | First event starts at version 1; next event after version 1 saves at version 2 | Passed |
| Concurrent version collision | Duplicate-key collision causes version lookup and save retry | Retries versions 2 then 3 and succeeds |
| Schema enum | EventStore rejects `ShipmentCancelled` and exposes the four expected enum values | Passed |

Result: **23 tests passed, 0 failed**. This includes the pre-existing tests for
request validation, duplicate handling, version increments, and the Day 20
concurrent-version retry. No regression was found, so no production code fix
was needed.

## Original Day 12 handoff cases

Tested endpoint: `POST http://localhost:5000/shipment/move`. Import
`backend/postman/Audit-Trail-Day-12.postman_collection.json` into Postman to
repeat the HTTP examples against a running backend and MongoDB instance.

| Case | Request body | Expected response | Result |
| --- | --- | --- | --- |
| Valid request | `{ "aggregateId": "day12-valid", "eventType": "ShipmentCreated", "payload": { "origin": "Chennai" } }` | `201 Created`; shipment event response with version 1 | Passed by automated route test |
| Missing aggregate ID | `{ "eventType": "ShipmentCreated", "payload": {} }` | `400 Bad Request`; `{ "error": "aggregateId and eventType are required" }` | Passed |
| Wrong aggregate ID type | `{ "aggregateId": 123, "eventType": "ShipmentCreated", "payload": {} }` | `400 Bad Request`; `{ "error": "aggregateId must be a string" }` | Passed |
| Missing payload | `{ "aggregateId": "day12-no-payload", "eventType": "ShipmentCreated" }` | `400 Bad Request`; `{ "error": "payload is required" }` | Passed |
| Duplicate event | Submit the same aggregate, type, and payload within five seconds | First: `201 Created`; second: `409 Conflict`; `{ "error": "Duplicate event detected" }` | Passed |
| Invalid event type | `{ "aggregateId": "day12-invalid-type", "eventType": "ShipmentCancelled", "payload": {} }` | `400 Bad Request`; eventType enum error listing supported types | Passed |

Automated HTTP tests ran against the Express app with EventStore methods stubbed;
they did not write to or depend on a live MongoDB database.
