export const shortHash = (hash) => (hash ? hash.slice(0, 8) : '')

export function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const UNITS = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

/** "3 days ago", "in 2 hours" ... relative to `now`. */
export function relativeTime(value, now = Date.now()) {
  const diff = new Date(value).getTime() - now
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit)
  }
  return rtf.format(0, 'minute')
}

export const statusLabel = (status) =>
  status ? status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Not created'

export const eventLabel = (eventType) =>
  eventType
    .replace(/^Shipment/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

export const formatTemp = (value) => (value === null || value === undefined ? '-' : `${Number(value).toFixed(1)} °C`)
