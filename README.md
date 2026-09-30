# Audit Trail

Event Sourcing backend for tracking shipment events.

## API Contract

### Base URL

`/api/shipments`

### GET /api/shipments/:id

Returns the current shipment state and complete event history.

#### Example Request

GET /api/shipments/SHIP123

#### Success Response

```json
{
  "success": true,
  "shipmentId": "SHIP123",
  "currentState": {
    "shipmentId": "SHIP123",
    "status": "DELIVERED"
  },
  "eventHistory": [
    {
      "aggregateId": "SHIP123",
      "eventType": "ShipmentCreated",
      "timestamp": "2026-09-18T09:00:00Z"
    },
    {
      "aggregateId": "SHIP123",
      "eventType": "ShipmentPacked",
      "timestamp": "2026-09-18T10:00:00Z"
    },
    {
      "aggregateId": "SHIP123",
      "eventType": "ShipmentShipped",
      "timestamp": "2026-09-18T11:00:00Z"
    },
    {
      "aggregateId": "SHIP123",
      "eventType": "ShipmentDelivered",
      "timestamp": "2026-09-18T12:00:00Z"
    }
  ]
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error fetching shipment"
}
```
## Event Store Schema

The Event Store stores shipment events used by the event-sourcing flow.

### Fields

| Field | Description |
|---|---|
| ggregateId | Identifies the shipment/entity associated with the event. |
| eventType | Identifies the type of event that occurred. |
| payload | Stores the data associated with the event. |
| 	imestamp | Records when the event occurred. |
| ersion | Tracks the event version for the aggregate. |

### Supported Event Types

The Event Store supports the following shipment event types:

- ShipmentCreated
- ShipmentPacked
- ShipmentShipped
- ShipmentDelivered

### Validation and Indexing

- Required fields are validated by the Event Store schema.
- eventType is restricted to the supported event types.
- An index is maintained on ggregateId for aggregate-based event queries.
- An index is maintained on 	imestamp for timestamp-based event queries.
- New events use the next version for the related aggregate.
- Duplicate events are checked before a new event is stored.

### Query Compatibility

Shipment events are retrieved using ggregateId and ordered by 	imestamp. The retrieved events are used by the shipment fold logic to calculate the current shipment state.
