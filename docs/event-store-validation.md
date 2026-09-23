# Day 12 — Event Type Validation Test

## Test Case

An invalid eventType was supplied to the EventStore schema:

WrongEventType

## Expected Result

The EventStore schema should reject the event because eventType is restricted by the schema enum.

## Actual Result

The invalid eventType was rejected by Mongoose validation.

## Conclusion

The EventStore eventType enum validation correctly prevents unsupported event types from being stored.
