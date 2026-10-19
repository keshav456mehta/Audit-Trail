# Work log (historical)

These are the team's original day-by-day notes from building version 1. They are kept as a record of the process
and are **not** the current documentation (see `../ARCHITECTURE.md` and `../API.md`).

Some statements in them describe version 1 and no longer apply to version 2, for example: "concurrency-safe"
(v1 retried silently; v2 rejects stale writes with 409), the 5-second duplicate-event window (replaced by idempotency keys),
the four-event lifecycle (now seven event types), and the `DAY12`/`DAY6` test counts (the test suite was rewritten).
See `../../CHANGELOG.md`.
