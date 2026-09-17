function foldShipmentEvents(events) {
    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const state = {
        shipmentId: null,
        status: "CREATED"
    };

    for (const event of sortedEvents) {
        state.shipmentId = event.aggregateId;

        switch (event.eventType) {
            case "ShipmentCreated":
                state.status = "CREATED";
                break;
            case "ShipmentPacked":
                state.status = "PACKED";
                break;
            case "ShipmentShipped":
                state.status = "SHIPPED";
                break;
            case "ShipmentDelivered":
                state.status = "DELIVERED";
                break;
        }
    }

    return state;
}

module.exports = foldShipmentEvents;