import { eventLabel } from './format'

export const FIELDS = {
  ShipmentCreated: [
    { name: 'origin', label: 'Origin', required: true },
    { name: 'destination', label: 'Destination' },
  ],
  ShipmentPacked: [{ name: 'note', label: 'Note' }],
  ShipmentShipped: [{ name: 'vessel', label: 'Vessel' }],
  ShipmentArrivedAtPort: [{ name: 'port', label: 'Port' }],
  ShipmentDelivered: [{ name: 'signedBy', label: 'Signed by' }],
  ShipmentTemperatureRecorded: [{ name: 'temperature', label: 'Temperature (°C)', number: true, required: true }],
  ShipmentTemperatureSpike: [
    { name: 'temperature', label: 'Temperature (°C)', number: true, required: true },
    { name: 'threshold', label: 'Limit (°C)', number: true, required: true, initial: '8' },
  ],
}

export const typeLabel = eventLabel

/** Builds the payload for a command, or returns { error } for a missing/invalid field. */
export function buildPayload(eventType, values) {
  const payload = {}
  for (const field of FIELDS[eventType] ?? []) {
    const raw = (values[field.name] ?? field.initial ?? '').toString().trim()
    if (!raw) {
      if (field.required) return { error: `${field.label} is required` }
      continue
    }
    if (field.number) {
      const n = Number(raw)
      if (!Number.isFinite(n)) return { error: `${field.label} must be a number` }
      payload[field.name] = n
    } else {
      payload[field.name] = raw
    }
  }
  return { payload }
}
