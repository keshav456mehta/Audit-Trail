const foldShipmentEvents = require("./queries/foldShipmentEvents");

const singleEvent = [
    {
        aggregateId: "SHIP101",
        eventType: "ShipmentCreated",
        timestamp: "2026-09-19T10:00:00Z"
    }
];

const outOfOrderEvents = [
    {
        aggregateId: "SHIP202",
        eventType: "ShipmentShipped",
        timestamp: "2026-09-19T12:00:00Z"
    },
    {
        aggregateId: "SHIP202",
        eventType: "ShipmentCreated",
        timestamp: "2026-09-19T09:00:00Z"
    },
    {
        aggregateId: "SHIP202",
        eventType: "ShipmentPacked",
        timestamp: "2026-09-19T10:30:00Z"
    }
];

console.log("Single Event Test");
console.log(foldShipmentEvents(singleEvent));

console.log("\nOut-of-Order Test");
console.log(foldShipmentEvents(outOfOrderEvents));