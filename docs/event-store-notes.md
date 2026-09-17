# Event Store Field Documentation

## aggregateId

Identifies the aggregate or entity to which the event belongs.
It allows related events to be grouped for a specific entity.

## eventType

Defines what action or event occurred.
The only valid values are `ShipmentCreated`, `ShipmentPacked`,
`ShipmentShipped`, and `ShipmentDelivered`.

## payload

Stores the data associated with the event.
A flexible payload allows different event types to store different data.

## timestamp

Records when the event occurred.
It helps maintain the chronological order of events and supports audit history.

## version

Stores the version of the event or aggregate state.
In the future, versioning can help maintain event ordering and support
optimistic concurrency control when multiple updates happen to the same aggregate.

## Future Use of Version

The `version` field can help ensure that events for an aggregate
are processed in the expected order. It can also help detect conflicting
updates when multiple operations try to modify the same aggregate.
