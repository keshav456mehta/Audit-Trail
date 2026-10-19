import { describe, expect, it } from 'vitest'
import { buildPayload } from '../lib/commandFields'
import { eventLabel, formatTemp, relativeTime, statusLabel } from '../lib/format'
import { ApiError, clearToken, getToken, http, setToken, toApiError } from '../api/client'

describe('format helpers', () => {
  it('labels statuses and events', () => {
    expect(statusLabel('ARRIVED_AT_PORT')).toBe('Arrived at port')
    expect(statusLabel(null)).toBe('Not created')
    expect(eventLabel('ShipmentTemperatureSpike')).toBe('Temperature Spike')
    expect(formatTemp(4.25)).toBe('4.3 °C')
    expect(formatTemp(null)).toBe('-')
  })

  it('formats relative time', () => {
    const now = Date.parse('2026-10-10T12:00:00Z')
    expect(relativeTime('2026-10-07T12:00:00Z', now)).toMatch(/3 days ago/)
  })
})

describe('buildPayload', () => {
  it('requires required fields and parses numbers', () => {
    expect(buildPayload('ShipmentCreated', {}).error).toMatch(/Origin is required/)
    expect(buildPayload('ShipmentCreated', { origin: ' Pune ' }).payload).toEqual({ origin: 'Pune' })
    expect(buildPayload('ShipmentTemperatureRecorded', { temperature: 'abc' }).error).toMatch(/number/)
    expect(buildPayload('ShipmentTemperatureRecorded', { temperature: '4.5' }).payload).toEqual({ temperature: 4.5 })
  })

  it('applies the default spike limit', () => {
    expect(buildPayload('ShipmentTemperatureSpike', { temperature: '9.5' }).payload).toEqual({ temperature: 9.5, threshold: 8 })
  })
})

describe('api client', () => {
  it('maps server error bodies to ApiError', () => {
    const err = toApiError({ response: { status: 409, data: { error: { code: 'VERSION_CONFLICT', message: 'moved', details: { currentVersion: 3 } } } } })
    expect(err).toBeInstanceOf(ApiError)
    expect([err.status, err.code, err.message, err.details.currentVersion]).toEqual([409, 'VERSION_CONFLICT', 'moved', 3])
  })

  it('maps timeouts and network failures to readable messages', () => {
    expect(toApiError({ code: 'ECONNABORTED' }).code).toBe('TIMEOUT')
    expect(toApiError(new Error('boom')).message).toMatch(/Cannot reach the server/)
  })

  it('stores the token and attaches it as a bearer header', async () => {
    setToken('abc.def.ghi')
    expect(getToken()).toBe('abc.def.ghi')
    let seen
    await http.get('/health', { adapter: async (config) => { seen = config; return { data: {}, status: 200, statusText: 'OK', headers: {}, config } } })
    expect(seen.headers.Authorization).toBe('Bearer abc.def.ghi')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
