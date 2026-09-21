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
  "success": true,
  "message": "Error fetching shipment"
}
```