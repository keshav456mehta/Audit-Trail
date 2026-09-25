# Day 16 Stress Test Results

## Setup

Ran the backend against the local `audit-trail` MongoDB database. Sent concurrent `POST /shipment/move` requests with fresh `day16-1790262236517-*` aggregate IDs, then queried the events from MongoDB.

## Results

| Scenario | Requests | HTTP results | MongoDB result |
| --- | ---: | --- | --- |
| One aggregate, unique payloads | 20 | 20 × `201` | 20 events, versions `1` × 17 and `2` × 3 |
| Five separate aggregates, five unique requests each | 25 | 25 × `201` | Events remained within their requested aggregate IDs; per-aggregate versions were `[1,1,1,1,1]`, `[1,1,1,1,1]`, `[1,1,1,2,2]`, `[1,1,1,1,2]`, and `[1,1,1,1,2]` |
| One aggregate, same event and payload repeated concurrently | 12 | 12 × `201` | 12 events, all version `1`; all identical requests passed the duplicate check |

## Findings

Concurrent writes to the same aggregate can receive the same version because the handler reads the latest version and inserts the next event in separate operations. The stored histories therefore contain duplicate versions and gaps; the request burst produced neither a unique `1..N` sequence nor a `409` for identical concurrent requests.

Requests for different aggregate IDs stayed isolated. The duplicate-event check also uses a read-then-write sequence, so simultaneous matching requests can all pass before any of them is stored. No false duplicate rejections were observed in this run.

These are expected limitations of the current basic concurrency handling. No locking or optimistic concurrency changes were made, in keeping with the Day 16 scope.
