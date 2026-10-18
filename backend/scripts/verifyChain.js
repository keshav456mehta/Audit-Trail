/* Verifies the hash chain of every shipment. Exit code 1 if anything was tampered with (usable in cron/CI). */
const mongoose = require('mongoose');
const config = require('../config');
const EventStore = require('../models/EventStore');
const { verifyChain } = require('../domain/hash');

async function main() {
  await mongoose.connect(config.mongoUri);
  const ids = await EventStore.distinct('aggregateId');
  let broken = 0;

  for (const id of ids) {
    const events = await EventStore.find({ aggregateId: id }).sort({ version: 1 }).lean();
    const result = verifyChain(events);
    if (!result.valid) {
      broken += 1;
      console.error(`TAMPERED  ${id}: ${result.reason} at version ${result.brokenAtVersion}`);
    }
  }
  console.log(`${ids.length - broken}/${ids.length} shipment chains intact`);
  process.exitCode = broken ? 1 : 0;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
