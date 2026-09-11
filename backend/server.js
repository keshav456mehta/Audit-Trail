const express = require("express");
const shipmentQueries = require("./shipmentQueries");

const app = express();

app.use(express.json());

app.use("/api/shipments", shipmentQueries);

app.get("/", (req, res) => {
    res.send("Audit Trail Backend Running");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});