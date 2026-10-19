# Day 15 Review — September 23

## POST /shipment/move

The command route validates the aggregate ID, event type, and payload before writing. It rejects a matching recent event, gets the latest aggregate version, stores the next event in `EventStore`, and logs both request context and failures.

## CQRS split

Command routes write new events; query routes read the event history and compute the current shipment state.

## Demo cases

- Valid request: `201 Created` and the event is persisted.
- Repeated matching request within five seconds: `409 Duplicate event detected`.
- Invalid request, such as a missing aggregate ID or unsupported event type: `400`.

## Current limitation

Version allocation is a basic read-then-write approach and is not optimistic locking, so concurrent writes need further hardening.

## Next

Days 16–18: review schema compatibility with V. Divyesh, stress-test the event flow, and perform code cleanup.
