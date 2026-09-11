const express = require("express");

const router = express.Router();

router.get("/:id", (req, res) => {
    const id = req.params.id;

    res.status(200).json({
        success: true,
        shipmentId: id,
        message: "Dummy shipment route working"
    });
});

module.exports = router;