require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shipmentCommandsRouter = require('./commands/shipmentCommands');
const shipmentQueriesRouter = require('./queries/shipmentQueries');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/shipment', shipmentCommandsRouter);
app.use('/shipment', shipmentQueriesRouter);

app.get('/', (req, res) => {
  res.send('Audit Trail backend is running');
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/audit-trail';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

