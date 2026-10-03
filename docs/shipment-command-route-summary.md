# Shipment Command Route Summary

## Endpoint

`POST /shipment/move` records an event for a shipment aggregate. The router is mounted at `/shipment` in `backend/server.js` and implemented in `backend/commands/shipmentCommands.js`.

## Behavior

- Validates that `aggregateId`, `eventType`, and `payload` are provided.
- Accepts only the event types defined by the EventStore schema.
- Assigns the next aggregate version from the latest stored event.
- Rejects matching events created in the previous five seconds to prevent duplicate submissions.
- Retries a duplicate-version collision up to three times before returning a clean server error.
- Returns `201 Created` with the stored event for a successful command.

## Verification

The backend test suite exercises successful commands for every allowed event type, request validation, schema validation, version incrementing, retry behavior, duplicate detection, and error responses.

Verified on `main` at commit `afe06ca` with:

```powershell
npm.cmd test
```

Result: 27 tests passed, with no failures, skips, or cancellations.
