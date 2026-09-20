# Day 12: POST /shipment/move Test Results

Tested endpoint: `POST http://localhost:5000/shipment/move`

The cases below were verified by the backend route test suite. Import
`backend/postman/Audit-Trail-Day-12.postman_collection.json` into Postman to
repeat them against a running backend and MongoDB instance.

| Case | Request body | Response received | Result |
| --- | --- | --- | --- |
| Valid request | `{ "aggregateId": "day12-valid", "eventType": "ShipmentCreated", "payload": { "origin": "Chennai" } }` | `201 Created`; `{ "success": true, "message": "Shipment event recorded", "event": { "aggregateId": "day12-valid", "eventType": "ShipmentCreated", "payload": { "origin": "Chennai" }, "timestamp": "<generated>", "version": 1 } }` | Passed |
| Missing aggregate ID | `{ "eventType": "ShipmentCreated", "payload": {} }` | `400 Bad Request`; `{ "error": "aggregateId and eventType are required" }` | Passed |
| Wrong aggregate ID type | `{ "aggregateId": 123, "eventType": "ShipmentCreated", "payload": {} }` | `400 Bad Request`; `{ "error": "aggregateId must be a string" }` | Passed |
| Missing payload | `{ "aggregateId": "day12-no-payload", "eventType": "ShipmentCreated" }` | `400 Bad Request`; `{ "error": "payload is required" }` | Passed |
| Duplicate event | Submit the valid request twice within five seconds | First: `201 Created`; second: `409 Conflict`; `{ "error": "Duplicate event detected" }` | Passed |
| Invalid event type | `{ "aggregateId": "day12-invalid-type", "eventType": "ShipmentCancelled", "payload": {} }` | `400 Bad Request`; `{ "error": "eventType must be one of: ShipmentCreated, ShipmentPacked, ShipmentShipped, ShipmentDelivered" }` | Passed |

## Summary

All six handoff cases pass. The automated backend suite contains 16 passing
tests, including each behavior documented above. Dynamic event identifiers and
timestamps are represented by placeholders in the table.
