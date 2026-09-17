# Day 6 test results — `POST /shipment/move`

| Case | Request | Result |
| --- | --- | --- |
| Valid request | String `aggregateId`, normal object `payload` | `201 Created`; event is passed to the event store with the expected values. |
| Missing required fields | Missing `aggregateId`, `eventType`, or both | `400 Bad Request`; no event-store create call occurs. |
| Wrong data types | Numeric `aggregateId` and string `payload` | A numeric aggregate ID is rejected with `400`; `Mixed` payload intentionally allows a string. |
| Empty payload | `payload: {}` | `201 Created`; an empty object is accepted without a crash. |
| Missing or null payload | `payload` omitted or `payload: null` | `400 Bad Request`; no event is created. |
| Unexpected event type | An event type outside the approved four | `400 Bad Request`; no event is created. |
| No request body | No JSON body | `400 Bad Request`; fixed in Day 6 by safely defaulting `req.body` to an empty object. |
