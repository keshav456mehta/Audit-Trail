const T = {
  C: 'ShipmentCreated',
  P: 'ShipmentPacked',
  S: 'ShipmentShipped',
  R: 'ShipmentTemperatureRecorded',
  X: 'ShipmentTemperatureSpike',
}
const day = (n) => new Date(Date.UTC(2026, 9, n)).toISOString()

const steps = [
  [T.C, { origin: 'Mumbai Port', destination: 'Rotterdam' }, 1],
  [T.P, {}, 2],
  [T.S, { vessel: 'MSC Aurora' }, 3],
  [T.R, { temperature: 4.2 }, 4],
  [T.X, { temperature: 9.8, threshold: 8 }, 5],
]

export const events = steps.map(([eventType, payload, d], i) => ({
  id: `id-${i + 1}`,
  aggregateId: 'CONT-1',
  eventType,
  payload,
  timestamp: day(d),
  version: i + 1,
  prevHash: i === 0 ? '0'.repeat(64) : `h${i}`.padEnd(64, 'a'),
  hash: `h${i + 1}`.padEnd(64, 'b'),
}))

export const latestState = {
  shipmentId: 'CONT-1',
  exists: true,
  status: 'SHIPPED',
  version: 5,
  eventCount: 5,
  origin: 'Mumbai Port',
  destination: 'Rotterdam',
  vessel: 'MSC Aurora',
  currentTemperature: 9.8,
  maxTemperature: 9.8,
  spikeCount: 1,
  createdAt: day(1),
  lastEventAt: day(5),
  lastHash: events[4].hash,
  allowedNext: ['ShipmentArrivedAtPort', 'ShipmentTemperatureRecorded', 'ShipmentTemperatureSpike'],
}

export const shipmentResponse = {
  success: true,
  shipmentId: 'CONT-1',
  latestVersion: 5,
  isHistorical: false,
  currentState: latestState,
  count: 5,
  events,
}

export const metricsResponse = {
  success: true,
  points: [
    { version: 4, timestamp: day(4), temperature: 4.2, threshold: null, spike: false },
    { version: 5, timestamp: day(5), temperature: 9.8, threshold: 8, spike: true },
  ],
  markers: [
    { version: 1, timestamp: day(1), eventType: T.C, status: 'CREATED' },
    { version: 2, timestamp: day(2), eventType: T.P, status: 'PACKED' },
    { version: 3, timestamp: day(3), eventType: T.S, status: 'SHIPPED' },
  ],
  spikes: [{ version: 5 }],
  threshold: 8,
  stats: { count: 2, min: 4.2, max: 9.8, average: 7, latest: 9.8 },
}

export const integrityOk = { success: true, valid: true, checked: 5, headVersion: 5, headHash: events[4].hash }
