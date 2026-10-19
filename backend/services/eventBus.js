const { EventEmitter } = require('node:events');

/** In-process notifications. The projection worker also polls, so a missed signal is never fatal. */
const eventBus = new EventEmitter();
eventBus.setMaxListeners(50);

module.exports = eventBus;
