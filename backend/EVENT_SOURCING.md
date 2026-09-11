# Event Sourcing Engine — Notes (Day 1, Sep 9 2026)

## Core Concept
Instead of storing current state, the system stores a sequence of immutable
events. The current state is derived by replaying events in order.

## Key Components
- **Event Store**: append-only log of domain events (e.g. `AuditEntryCreated`,
  `AuditEntryUpdated`). Never mutated, only appended to.
- **Aggregate**: rebuilds its state by folding over its event stream.
- **Projection**: a read-optimized view built by consuming events
  (e.g. a table for fast querying, separate from the source of truth).
- **Snapshotting**: periodic saved state to avoid replaying the full event
  history on every load, for performance.

## Why it matters for Audit-Trail
- Every change is naturally auditable — the event log *is* the audit trail.
- Full history and point-in-time reconstruction come for free.
- Enables replay/debugging: any past state can be recreated exactly.

## Open questions for later days
- Which DB backs the event store (Postgres append-only table? dedicated
  event store)?
- Snapshot frequency/strategy.
- How projections get rebuilt if a bug is found (replay strategy).