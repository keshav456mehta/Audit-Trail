# Audit Trail

An **event-sourced, CQRS inventory & logistics ledger** (Axlero Advanced MERN, Project 2).
Shipment changes are never overwritten: each one is an immutable, hash-chained event, and the current state is
rebuilt by replaying them. A React dashboard lets you inspect a shipment, rewind it to any moment, see sensor data
against its timeline, and prove the history was not tampered with.

## What it does

| Spec requirement | Where |
| --- | --- |
| CQRS: separate write and read routers | `POST /shipment/move` vs `GET /shipment/:id`; `backend/routes/` |
| Append-only event store (aggregateId, eventType, payload, timestamp, version) | `backend/models/EventStore.js` |
| Event-sourcing engine: validate, append, fold | `backend/domain/shipment.js`, `backend/services/eventAppender.js` |
| Immutability (no UPDATE/DELETE) | Mongoose guards + DB role script + hash chain. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Projections / read model + background worker | `backend/projections/` |
| Optimistic concurrency control | required `expectedVersion`, 409 on conflict |
| Timeline UI, "rewind time" slider | `frontend/src/components/Timeline.jsx`, `TimeScrubber.jsx` |
| Recharts sensor metrics over the event timeline | `frontend/src/components/TemperatureChart.jsx` |
| Cryptographic proof of event sequence | SHA-256 hash chain, `/verify`, `npm run verify:chain` |

Plus: JWT auth with roles, Docker, CI, and a test suite that runs against a real database.

## Quick start

Requirements: Node 20+, MongoDB running locally (or a connection string).

```bash
# backend
cd backend
npm install
cp .env.example .env        # defaults work for local development
npm run seed                # demo users + 3 demo shipments
npm run dev                 # http://localhost:5000

# frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```

Sign in with `operator` / `operator-pass-123` (development seed only; also `viewer` and `admin`, same pattern).
Open **CONT-DEMO-001** to see a shipment with a temperature spike, drag the slider to rewind it, and run "Re-verify".

Or with Docker: see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Scripts

| Where | Command | What |
| --- | --- | --- |
| root | `npm test` | backend + frontend tests |
| backend | `npm test` | domain unit tests + HTTP integration tests (needs MongoDB; `TEST_MONGO_URI` to override) |
| backend | `npm run seed` | idempotent demo data |
| backend | `npm run verify:chain` | verify every shipment's hash chain (exit 1 if tampered) |
| frontend | `npm test`, `npm run lint`, `npm run build` | |
| frontend | `E2E_API_URL=http://localhost:5000 npx vitest run src/test/live.e2e.test.js` | run the real client against a running backend |

## Tests

- **Backend:** pure domain tests, plus HTTP tests against a real database and a real server: validation, auth/roles,
  state machine, **a 12-way write race**, idempotency, **12 ways of trying to modify the log**, tamper detection, time travel,
  projections, rebuild, CORS and error hygiene.
- **Frontend:** reducer, API client, components, and full user flows with mocked API, including a test that renders the whole
  app (it would have caught the v1 blank-page crash).
- **Live end-to-end:** the real frontend API client against the real backend.

See [CHANGELOG.md](CHANGELOG.md) for what changed from v1 and why. The original team notes are in [docs/worklog](docs/worklog).

## Documentation

[Architecture](docs/ARCHITECTURE.md) · [API](docs/API.md) · [Deployment](docs/DEPLOYMENT.md) · Postman: `backend/postman/`

## Honest limitations

- Event streams are replayed on every command. Fine for hundreds of events per shipment; add snapshots beyond thousands.
- The hash chain proves tampering happened; it cannot stop someone with raw database access. Use the append-only DB role
  and anchor the head hash off-system for real assurance (see Architecture).
- The read model is eventually consistent (milliseconds); `GET /shipment/:id` is always exact.
