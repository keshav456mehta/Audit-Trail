# Day 12: POST /shipment/move Test Results

Tested endpoint: `POST http://localhost:5000/shipment/move`

The cases below were verified by the backend route test suite. Import
`backend/postman/Audit-Trail-Day-12.postman_collection.json` into Postman to
repeat them against a running backend and MongoDB instance.

| Case | Request body | Expected result | Verified result |
| --- | --- | --- | --- |
| Valid request | `{ "aggregateId": "day12-valid", "eventType": "ShipmentCreated", "payload": { "origin": "Chennai" } }` | `201`; event is recorded | Passed |
| Missing aggregate ID | `{ "eventType": "ShipmentCreated", "payload": {} }` | `400`; `aggregateId and eventType are required` | Passed |
| Wrong aggregate ID type | `{ "aggregateId": 123, "eventType": "ShipmentCreated", "payload": {} }` | `400`; `aggregateId must be a string` | Passed |
| Missing payload | `{ "aggregateId": "day12-no-payload", "eventType": "ShipmentCreated" }` | `400`; `payload is required` | Passed |
| Duplicate event | Submit the same valid request twice within five seconds | First request: `201`; second request: `409`; `Duplicate event detected` | Passed |
| Invalid event type | `{ "aggregateId": "day12-invalid-type", "eventType": "ShipmentCancelled", "payload": {} }` | `400`; lists the four allowed event types | Passed |

## Summary

All six cases pass. The automated backend suite contains 16 passing tests,
including each behavior documented above.
