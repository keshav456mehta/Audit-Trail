# Architecture

Audit Trail is an event-sourced, CQRS shipment ledger. Nothing is ever overwritten: every change is a new,
hash-chained event, and the "current state" of a shipment is computed by replaying its events.

```
                 ┌────────────── write side (commands) ──────────────┐
 React ──JWT──▶  POST /shipment/move ──▶ appendEvent() ──▶ EventStore (append-only)
 dashboard                               │  1. idempotency replay?         │
                                         │  2. expectedVersion == stream?  │  unique {aggregateId, version}
                                         │  3. domain.decide() rules       │  unique {aggregateId, idempotencyKey}
                                         │  4. hash chain link             │
                                         └──▶ eventBus "event.appended" ───┤
                                                                           ▼
                 ┌────────────── read side (queries) ───────────┐   ProjectionWorker
 React ◀─────    GET /shipment/:id        (replays the stream: truth)      │ (event signal + polling + checkpoint)
                 GET /shipment/:id?version=N | ?asOf=…  (time travel)     ▼
                 GET /shipment/:id/metrics · /verify            ShipmentReadModel (disposable)
                 GET /shipment · GET /stats/shipments  ◀── read model + aggregation pipelines
```

## Layers

| Folder | Responsibility |
| --- | --- |
| `backend/domain/` | **Pure** logic, no I/O: state machine (`decide`), `apply`/`fold`, time travel (`stateAt`), metrics, SHA-256 hash chain. |
| `backend/models/` | Mongoose models. `EventStore` is append-only. |
| `backend/services/eventAppender.js` | The **only** write path into the event store. |
| `backend/projections/` | Read-model builder (worker). |
| `backend/routes/` | `shipmentCommands` (write) and `shipmentQueries` (read) are separate routers (CQRS). |
| `backend/middleware/` | JWT auth + roles, validation, error handling. |

## Event model

`aggregateId, eventType, payload, timestamp, version, idempotencyKey, prevHash, hash`

Lifecycle: `Created → Packed → Shipped → (ArrivedAtPort) → Delivered`.
Telemetry (`TemperatureRecorded`, `TemperatureSpike`) can be recorded any time after creation and before delivery.
Illegal moves (skipping a stage, going backwards, acting on a delivered or non-existent shipment) are rejected with 422.

## Optimistic concurrency control

The client sends the `expectedVersion` it last loaded (0 for a new shipment). If the stream has moved on, the command is
rejected with **409 `VERSION_CONFLICT`** and the current version; it is never silently re-based. The unique
`{aggregateId, version}` index makes this safe even when two requests race (tested: 12 parallel writers, exactly one wins).
Retrying a command with the same `idempotencyKey` is safe: it returns the original event (200, `replayed: true`).

## Immutability, in four layers

1. Every field of the schema is `immutable` and the schema is `strict: 'throw'`.
2. Every Mongoose update/replace/delete/bulk operation throws `EVENT_STORE_IMMUTABLE`, and an existing event cannot be re-saved.
3. **Database level:** `backend/scripts/mongo-appender-role.js` creates a MongoDB role with `find`/`insert` only on the event collection.
   Use it in production: it is the only layer that stops someone using the raw driver or a shell.
4. **Detection:** the hash chain. Each event's hash covers its content and the previous event's hash, so editing,
   re-ordering or deleting a stored event is detectable (`GET /shipment/:id/verify`, `npm run verify:chain`).

Known limit: a hash chain alone cannot see events deleted from the **tail**. `verify` therefore also compares the stream
with the read model, which remembers how far the stream had got. An attacker who edits the event log *and* the read model
*and* recomputes every later hash can still forge history: for that, anchor `headHash` somewhere you trust (a log
shipper, a separate database, a ticket) on a schedule.

## Projections (read model)

`ProjectionWorker` keeps `shipment_read_models` current from the event log. It is notified in-process after each append
**and** polls from a checkpoint, so a missed signal or a restart never loses data. Rows are updated with a
compare-and-set on `version`, so concurrent workers cannot corrupt them, and a row that disagrees with the stream heals itself.
The read model is disposable: `POST /admin/projections/rebuild` drops it and replays everything.
It powers `GET /shipment` (list, filter, search, pagination) and `GET /stats/shipments` (aggregation pipelines).
It is eventually consistent (typically milliseconds); `GET /shipment/:id` always replays the stream and is always exact.

## Time travel

`GET /shipment/:id?version=N` or `?asOf=<ISO time>` folds only the events up to that point and returns the exact state
at that moment, plus `latestVersion` and `isHistorical`. The dashboard's "Rewind time" slider uses this.

## Security

- JWT (HS256, 8 h) + bcrypt; roles `viewer` < `operator` < `admin`. Reads need viewer, writes operator, rebuilds admin.
- `helmet`, CORS allow-list (`CORS_ORIGINS`), global rate limit, strict login rate limit, 16 kB body limit.
- IDs are validated (`^[A-Za-z0-9._:-]{1,64}$`), so objects (`{"$ne":null}`) can never reach a Mongo query.
- The server refuses to start in production without a strong `JWT_SECRET`; 500 responses never leak internals.
