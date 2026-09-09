# Day 1 — CQRS Notes

## Command-side responsibility

Command routes are the write side of the application. They receive an action
request, validate it, apply the relevant business rules, and persist the
resulting audit event. They must not be used to assemble read-model data for
the UI.

## Working flow

1. A route accepts a command and validates its input.
2. The command handler performs the intended state change.
3. The handler records an immutable audit event containing the action,
   actor, timestamp, and relevant metadata.
4. Query routes read stored data without creating audit events or changing
   application state.

This note records the Day 1 CQRS baseline until the project design document is
added to the repository.
