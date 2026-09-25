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

## Day 17 Triage

The duplicate versions are a real concurrency limitation: version selection and event insertion are separate operations. Fixing this safely requires an atomic per-aggregate version allocator or a compare-and-swap retry design. Adding a unique `{ aggregateId, version }` index alone is not a safe immediate fix because the stress run already recorded duplicate pairs; MongoDB would reject index creation until existing data is reconciled. A retry loop without a database-enforced uniqueness condition would not prevent collisions.

The simultaneous duplicate-request race also remains. A reliable fix needs a client-supplied idempotency key with a unique constraint; the current payload-based time-window check cannot serialize concurrent matching requests. Keep both issues as known limitations for this project scope pending agreement on the larger data-model change.

No concurrency code or database index change was retained. The Day 16 stress results above remain the verification evidence; the stress test was not rerun because behavior was not changed. Decide on atomic version allocation and idempotency keys with the project team before shipping a concurrency fix.
