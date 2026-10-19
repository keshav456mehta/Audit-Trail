/*
 * Run once with mongosh as an admin to make the event store append-only AT THE DATABASE LEVEL:
 *
 *   mongosh "mongodb://admin:***@host:27017/admin" backend/scripts/mongo-appender-role.js
 *
 * The application then connects as `audit_app`, which can read and insert events but has no
 * privilege to update or remove them - even if someone bypasses the Mongoose guards.
 * Change the password before use, and keep it in your secrets manager, never in git.
 */
const appDb = db.getSiblingDB('audit-trail');

appDb.createRole({
  role: 'eventAppender',
  privileges: [
    // append-only on the event log (collection name Mongoose derives from the EventStore model)
    { resource: { db: 'audit-trail', collection: 'eventstores' }, actions: ['find', 'insert', 'createIndex', 'listIndexes'] },
    // normal read/write on everything that is allowed to change
    ...['shipment_read_models', 'projection_checkpoints', 'users'].map((collection) => ({
      resource: { db: 'audit-trail', collection },
      actions: ['find', 'insert', 'update', 'remove', 'createIndex', 'listIndexes'],
    })),
  ],
  roles: [],
});

appDb.createUser({
  user: 'audit_app',
  pwd: passwordPrompt(),
  roles: ['eventAppender'],
});

print('Created role eventAppender and user audit_app. Point MONGO_URI at audit_app.');
