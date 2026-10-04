# Day 6 test results — `POST /shipment/move`

| Case | Request | Result |
| --- | --- | --- |
| Valid request | String `aggregateId`, normal object `payload` | `201 Created`; event is passed to the event store with the expected values. |
| Missing required fields | Missing `aggregateId`, `eventType`, or both | `400 Bad Request`; no event-store create call occurs. |
| Wrong data types | Numeric `aggregateId` and string `payload` | The endpoint accepts both. Mongoose casts the numeric aggregate ID to a string; `Mixed` payload intentionally allows a string. No crash occurs. |
| Empty payload | `payload: {}` | `201 Created`; an empty object is accepted without a crash. |
| Unexpected event type | `eventType: "BANANA"` | `201 Created`; event-type allow-list validation has not been added yet (scheduled for Day 8). |
| No request body | No JSON body | `400 Bad Request`; fixed in Day 6 by safely defaulting `req.body` to an empty object. |
