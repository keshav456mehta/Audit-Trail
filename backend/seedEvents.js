const mongoose = require("mongoose");
const EventStore = require("./models/EventStore");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/audit-trail";

const events = [
  {
    aggregateId: "shipment-001",
    eventType: "ShipmentCreated",
    payload: {
      shipmentId: "shipment-001",
      status: "created",
    },
    timestamp: new Date(),
    version: 1,
  },
  {
    aggregateId: "shipment-001",
    eventType: "ShipmentDispatched",
    payload: {
      shipmentId: "shipment-001",
      status: "dispatched",
    },
    timestamp: new Date(),
    version: 2,
  },
  {
    aggregateId: "shipment-002",
    eventType: "ShipmentCreated",
    payload: {
      shipmentId: "shipment-002",
      status: "created",
    },
    timestamp: new Date(),
    version: 1,
  },
];

async function seedEvents() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected");

    await EventStore.insertMany(events);

    console.log("3 sample events inserted successfully");
  } catch (error) {
    console.error("Error seeding events:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

seedEvents();