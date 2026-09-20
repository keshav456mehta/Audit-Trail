const express = require("express");
const router = express.Router();

const EventStore = require("../models/EventStore");
const foldShipmentEvents = require("../foldShipmentEvents");

router.get("/:id", async (req, res) => {
    try {
        const events = await EventStore.find({
            aggregateId: req.params.id
        }).sort({ timestamp: 1 });

        const currentState = foldShipmentEvents(events);

        res.status(200).json({
            success: true,
            shipmentId: req.params.id,
            currentState,
            count: events.length,
            events: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching events"
        });
    }
});

module.exports = router;
