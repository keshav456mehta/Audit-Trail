# Changelog

## 2.0.0: review-driven rebuild

Everything below fixes a specific finding from the project review against the Axlero spec.

### Blocking bug
- **Frontend white screen.** `Timeline.jsx` had hooks and JSX pasted at module level (`useState is not defined` on load).
  Removed; a regression test now renders the whole `App` so an import-time crash fails the build.

### Spec features that were missing
- **Immutability** enforced (immutable fields + every update/delete/bulk op blocked + DB role script) and tested (12 bypass attempts).
- **Projections:** read-model collection + background worker (signal + checkpointed polling), rebuildable, self-healing.
- **Time travel:** `?version=` / `?asOf=` endpoint and a "Rewind time" slider backed by the server.
- **Optimistic concurrency control:** required `expectedVersion`; stale commands get 409 (v1 silently retried).
- **Recharts** temperature chart with threshold line, spike markers and lifecycle events overlaid; sensor events added to the domain.
- **Tamper evidence:** SHA-256 hash chain, verify endpoint, `npm run verify:chain`, UI badge.

### Correctness
- State machine: no skipping stages, no going backwards, no events after delivery, no events before creation.
- Unknown shipment is `404`, not a fake `CREATED` shipment. Replay ordering is by `version`, not timestamp.
- The 5-second duplicate guess (which would reject legitimate identical sensor readings) became real idempotency keys.

### Security & platform
- JWT auth + bcrypt + roles, helmet, CORS allow-list, rate limits, body limit, ID validation, safe error handler, startup secret checks.
- Dockerfiles, docker-compose, GitHub Actions CI, env templates, deployment guide, `/health`.

### Quality
- Tests: 82 backend (real database, no mocks) + 36 frontend + a live end-to-end suite. v1 had 27 tests against a stubbed DB.
- Docs rewritten to match the code (the v1 README documented wrong routes and field names); chat-transcript and blank-template docs removed.
- Frontend: encoded URLs, loading/error/not-found states, `res.ok` handling, axios used properly, lazy-loaded chart,
  event-listener leak and reduced-motion handling in the comet background, stray react-scripts script and unused files removed.
