# Audit Trail

Event Sourcing backend for tracking shipment events.

## API Contract

### Base URL

`/api/shipments`

### 1. Get Shipment Events

**Endpoint**

`GET /api/shipments/:id`

**Description**

Returns all events for the given shipment ID.

**Example Request**

`GET /api/shipments/SHIP123`

**Success Response**

```json
{
  "success": true,
  "shipmentId": "SHIP123",
  "count": 2,
  "events": []
}
```

**Error Response**

```json
{
  "success": false,
  "message": "Error fetching events"
}
```