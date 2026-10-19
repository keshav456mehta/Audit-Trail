/*
 * Proves the DATABASE USER in MONGO_URI cannot modify or delete events (the append-only role is active).
 *   node scripts/checkDbRole.js
 *
 * Safe to run: every filter matches nothing, so even if the database allows an operation no data changes.
 * (The database checks permission before it looks for matching documents.)
 */
const mongoose = require('mongoose');
const config = require('../config');

const NOTHING = { aggregateId: '__role_check__' };

async function attempt(label, expectRefused, fn) {
  try {
    await fn();
    console.log(`${expectRefused ? 'FAIL' : 'OK  '}  ${label}: the database ALLOWED it`);
    return !expectRefused;
  } catch (error) {
    // MongoDB says code 13 / Unauthorized; Atlas custom roles say "user is not allowed to do action [...]"
    const refused =
      error.code === 13 ||
      error.codeName === 'Unauthorized' ||
      /not allowed to do\s*action|not authorized|unauthorized/i.test(error.message || '');
    if (!refused) {
      console.log(`ERROR ${label}: ${error.message}`);
      return false;
    }
    console.log(`${expectRefused ? 'OK  ' : 'FAIL'}  ${label}: refused by the database`);
    return expectRefused;
  }
}

async function main() {
  await mongoose.connect(config.mongoUri);
  const db = mongoose.connection;
  const events = db.collection('eventstores');
  const readModel = db.collection('shipment_read_models');

  const results = [
    await attempt('read events', false, () => events.findOne(NOTHING)),
    await attempt('UPDATE an event', true, () => events.updateMany(NOTHING, { $set: { tampered: true } })),
    await attempt('DELETE an event', true, () => events.deleteMany(NOTHING)),
    await attempt('write to the read model (should be allowed)', false, () => readModel.updateMany({ shipmentId: '__role_check__' }, { $set: { x: 1 } })),
  ];

  const ok = results.every(Boolean);
  console.log(ok ? '\nAppend-only role is ACTIVE.' : '\nRole is NOT active (or something else is wrong). See lines above.');
  process.exitCode = ok ? 0 : 1;
}

main()
  .catch((error) => {
    console.error('Could not run the check:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());