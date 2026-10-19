/**
 * Pure shipment domain logic: no database, no HTTP.
 *   decide()  - may this command be appended to the current state?
 *   apply()   - how does one event change the state?
 *   fold()    - replay a stream of events into the current state.
 */

const EVENT_TYPES = Object.freeze({
  CREATED: 'ShipmentCreated',
  PACKED: 'ShipmentPacked',
  SHIPPED: 'ShipmentShipped',
  ARRIVED_AT_PORT: 'ShipmentArrivedAtPort',
  DELIVERED: 'ShipmentDelivered',
  TEMPERATURE_RECORDED: 'ShipmentTemperatureRecorded',
  TEMPERATURE_SPIKE: 'ShipmentTemperatureSpike',
});

const ALL_EVENT_TYPES = Object.freeze(Object.values(EVENT_TYPES));

const STATUS_BY_EVENT = Object.freeze({
  [EVENT_TYPES.CREATED]: 'CREATED',
  [EVENT_TYPES.PACKED]: 'PACKED',
  [EVENT_TYPES.SHIPPED]: 'SHIPPED',
  [EVENT_TYPES.ARRIVED_AT_PORT]: 'ARRIVED_AT_PORT',
  [EVENT_TYPES.DELIVERED]: 'DELIVERED',
});

const LIFECYCLE_STATUSES = Object.freeze(['CREATED', 'PACKED', 'SHIPPED', 'ARRIVED_AT_PORT', 'DELIVERED']);

// status -> lifecycle events allowed next
const NEXT_LIFECYCLE = Object.freeze({
  CREATED: [EVENT_TYPES.PACKED],
  PACKED: [EVENT_TYPES.SHIPPED],
  SHIPPED: [EVENT_TYPES.ARRIVED_AT_PORT, EVENT_TYPES.DELIVERED],
  ARRIVED_AT_PORT: [EVENT_TYPES.DELIVERED],
  DELIVERED: [],
});

const TELEMETRY_EVENTS = Object.freeze([EVENT_TYPES.TEMPERATURE_RECORDED, EVENT_TYPES.TEMPERATURE_SPIKE]);

const iso = (value) => (value == null ? null : new Date(value).toISOString());

function initialState(shipmentId = null) {
  return {
    shipmentId,
    exists: false,
    status: null,
    version: 0,
    createdAt: null,
    lastEventAt: null,
    origin: null,
    destination: null,
    vessel: null,
    currentTemperature: null,
    maxTemperature: null,
    spikeCount: 0,
    eventCount: 0,
    lastHash: null,
  };
}

function compareEvents(a, b) {
  return a.version - b.version || new Date(a.timestamp) - new Date(b.timestamp);
}

/** Returns a new state; never mutates the input. */
function apply(state, event) {
  const next = {
    ...state,
    shipmentId: event.aggregateId,
    exists: true,
    version: event.version,
    lastEventAt: iso(event.timestamp),
    eventCount: state.eventCount + 1,
    lastHash: event.hash ?? null,
  };
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};

  if (STATUS_BY_EVENT[event.eventType]) next.status = STATUS_BY_EVENT[event.eventType];

  switch (event.eventType) {
    case EVENT_TYPES.CREATED:
      next.createdAt = iso(event.timestamp);
      next.origin = payload.origin ?? null;
      next.destination = payload.destination ?? null;
      break;
    case EVENT_TYPES.SHIPPED:
      next.vessel = payload.vessel ?? null;
      break;
    case EVENT_TYPES.TEMPERATURE_RECORDED:
    case EVENT_TYPES.TEMPERATURE_SPIKE:
      next.currentTemperature = payload.temperature;
      next.maxTemperature =
        state.maxTemperature === null ? payload.temperature : Math.max(state.maxTemperature, payload.temperature);
      if (event.eventType === EVENT_TYPES.TEMPERATURE_SPIKE) next.spikeCount = state.spikeCount + 1;
      break;
    default:
      break;
  }
  return next;
}

function fold(events, shipmentId = null) {
  return [...events].sort(compareEvents).reduce(apply, initialState(shipmentId));
}

/** State as it existed at `version` and/or at time `asOf` (inclusive). */
function stateAt(events, { version, asOf } = {}) {
  const cutoff = asOf ? new Date(asOf).getTime() : null;
  const visible = events.filter(
    (e) => (version === undefined || e.version <= version) && (cutoff === null || new Date(e.timestamp).getTime() <= cutoff),
  );
  return { state: fold(visible, events[0]?.aggregateId ?? null), events: [...visible].sort(compareEvents) };
}

function allowedNext(state) {
  if (!state.exists) return [EVENT_TYPES.CREATED];
  if (state.status === 'DELIVERED') return [];
  return [...NEXT_LIFECYCLE[state.status], ...TELEMETRY_EVENTS];
}

/** Adds derived fields for API output. Not stored in the read model. */
function describe(state) {
  return { ...state, allowedNext: allowedNext(state) };
}

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isOptionalString = (v) => v === undefined || (typeof v === 'string' && v.length <= 120);

function payloadError(eventType, payload) {
  if (!isPlainObject(payload)) return 'payload must be a JSON object';

  switch (eventType) {
    case EVENT_TYPES.CREATED:
      if (typeof payload.origin !== 'string' || !payload.origin.trim() || payload.origin.length > 120) {
        return 'ShipmentCreated payload.origin must be a non-empty string (max 120 chars)';
      }
      if (!isOptionalString(payload.destination)) return 'payload.destination must be a string (max 120 chars)';
      return null;
    case EVENT_TYPES.SHIPPED:
      return isOptionalString(payload.vessel) ? null : 'payload.vessel must be a string (max 120 chars)';
    case EVENT_TYPES.TEMPERATURE_RECORDED:
      if (!isFiniteNumber(payload.temperature) || payload.temperature < -100 || payload.temperature > 100) {
        return 'payload.temperature must be a number between -100 and 100 (deg C)';
      }
      return null;
    case EVENT_TYPES.TEMPERATURE_SPIKE:
      if (!isFiniteNumber(payload.temperature) || !isFiniteNumber(payload.threshold)) {
        return 'payload.temperature and payload.threshold must be numbers';
      }
      if (payload.temperature <= payload.threshold) return 'a spike needs payload.temperature > payload.threshold';
      return null;
    default:
      return null;
  }
}

/** Returns null when the command is acceptable, otherwise { code, message, allowedNext }. */
function decide(state, eventType, payload) {
  if (!ALL_EVENT_TYPES.includes(eventType)) {
    return { code: 'UNKNOWN_EVENT_TYPE', message: `eventType must be one of: ${ALL_EVENT_TYPES.join(', ')}` };
  }
  const invalidPayload = payloadError(eventType, payload);
  if (invalidPayload) return { code: 'INVALID_PAYLOAD', message: invalidPayload };

  const permitted = allowedNext(state);
  if (!permitted.includes(eventType)) {
    let message;
    if (!state.exists) message = 'This shipment does not exist yet: its first event must be ShipmentCreated';
    else if (eventType === EVENT_TYPES.CREATED) message = 'This shipment already exists';
    else if (state.status === 'DELIVERED') message = 'This shipment is DELIVERED; no further events are allowed';
    else message = `Cannot record ${eventType} while the shipment is ${state.status}`;
    return { code: 'INVALID_TRANSITION', message, allowedNext: permitted };
  }
  return null;
}

/** Temperature series, spikes and lifecycle markers for the dashboard chart. */
function buildMetrics(events) {
  const sorted = [...events].sort(compareEvents);
  const points = [];
  const markers = [];

  for (const e of sorted) {
    if (TELEMETRY_EVENTS.includes(e.eventType)) {
      points.push({
        version: e.version,
        timestamp: iso(e.timestamp),
        temperature: e.payload.temperature,
        threshold: e.payload.threshold ?? null,
        spike: e.eventType === EVENT_TYPES.TEMPERATURE_SPIKE,
      });
    } else {
      markers.push({ version: e.version, timestamp: iso(e.timestamp), eventType: e.eventType, status: STATUS_BY_EVENT[e.eventType] ?? null });
    }
  }

  const temps = points.map((p) => p.temperature);
  const spikes = points.filter((p) => p.spike);
  return {
    points,
    markers,
    spikes,
    threshold: spikes.length ? spikes[spikes.length - 1].threshold : null,
    stats: temps.length
      ? {
          count: temps.length,
          min: Math.min(...temps),
          max: Math.max(...temps),
          average: Number((temps.reduce((s, t) => s + t, 0) / temps.length).toFixed(2)),
          latest: temps[temps.length - 1],
        }
      : null,
  };
}

module.exports = {
  EVENT_TYPES,
  ALL_EVENT_TYPES,
  LIFECYCLE_STATUSES,
  STATUS_BY_EVENT,
  initialState,
  apply,
  fold,
  stateAt,
  allowedNext,
  describe,
  decide,
  buildMetrics,
  compareEvents,
};
