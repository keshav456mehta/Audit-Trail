const express = require('express');
const cors = require('cors');
const shipmentCommandsRouter = require('./commands/shipmentCommands');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/shipment', shipmentCommandsRouter);

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
