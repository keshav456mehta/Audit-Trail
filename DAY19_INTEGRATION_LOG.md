# Day 19 Integration Test Log

## Setup

- Backend connected to the local `audit-trail` MongoDB database and listened on port 5000.
- The backend route suite completed with 17 passing tests and no failures.
- All live requests used fresh `day19-*` aggregate IDs.

## End-to-end write/read check

Shipment ID: `day19-74a3374f2c06477b9a0eb9677b9277c7`

| Step | Result |
| --- | --- |
| POST `ShipmentCreated` | `201 Created`, version 1 |
| Repeat identical POST within the duplicate window | `409 Conflict` |
| POST `ShipmentPacked` | `201 Created`, version 2 |
| GET shipment | `200 OK`, 2 events, folded state `PACKED` |

## Concurrent write check

Shipment ID: `day19-concurrent-1790510395562`

Sent 20 concurrent `POST /shipment/move` requests with distinct payloads to one aggregate. All 20 returned `201 Created`; GET returned 20 events, but versions were `[1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3]`. This confirms the known race between reading the latest version and inserting the next event. The write path needs an atomic version allocation or compare-and-swap design before versions can be relied on under concurrent writes.

## Frontend integration follow-up

`GET /shipment/:id` returns both the folded `currentState` and timestamp-sorted `events`. `frontend/src/components/Timeline.jsx` currently derives its status badge from the last item in the event array. The backend's fold logic also sorts by timestamp, so this agrees for the current API response; passing `currentState` explicitly would keep the badge tied to the backend's computed state.

## Handoff

No endpoint, persistence, or frontend code changes were needed for the sequential end-to-end flow. The concurrent version race remains open and should be prioritized if concurrent writes are part of the integration acceptance criteria. The live test records are isolated under the two IDs above.

## Follow-up sanity pass

The backend and MongoDB were already reachable locally on ports 5000 and 27017. A fresh `POST /shipment/move` for `day19-followup-62c0d97ff49941b6b1bd6ce3e7bad855` returned `201 Created` with version 1. The following GET returned one `ShipmentCreated` event and current state `CREATED`. No new issue was found in this sequential write/read path.
