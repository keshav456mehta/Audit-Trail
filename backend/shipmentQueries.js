
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Shipment Queries Router Working"
    });
});

module.exports = router;