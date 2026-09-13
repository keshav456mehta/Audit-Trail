const express = require("express");
const router = express.Router();

const EventStore = require("../models/EventStore");
router.get("/:id", async (req, res) => {
    try {
        const events = await EventStore.find({
            aggregateId: req.params.id
        }).sort({ timestamp: 1 });

        res.json(events);
    } catch (err) {
        res.status(500).json({
            message: "Error fetching events"
        });
    }
});

module.exports = router;
