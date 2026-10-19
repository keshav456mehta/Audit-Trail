// Runs the REAL frontend API client against a REAL running backend + database.
//   cd backend && npm run seed && npm start
//   cd frontend && E2E_API_URL=http://localhost:5000 npx vitest run src/test/live.e2e.test.js
// Skipped automatically when E2E_API_URL is not set.
import { describe, expect, it } from 'vitest'

const API = process.env.E2E_API_URL
const run = API ? describe : describe.skip

run('frontend client against the live backend', () => {
  const id = `E2E-${Date.now()}`
  let api
  let ApiError

  it('logs in as operator and loads seeded data', async () => {
    import.meta.env.VITE_API_URL = API
    ;({ api, ApiError } = await import('../api/client'))
    const { setToken } = await import('../api/client')
    const login = await api.login('operator', process.env.E2E_OPERATOR_PASSWORD || 'operator-pass-123')
    setToken(login.token)
    expect(login.user.role).toBe('operator')

    const list = await api.listShipments({ limit: 10 })
    expect(list.items.length).toBeGreaterThan(0)
    expect((await api.stats()).total).toBeGreaterThan(0)
  })

  it('time travel matches the seeded history for CONT-DEMO-001', async () => {
    const latest = await api.getShipment('CONT-DEMO-001')
    expect(latest.currentState.status).toBe('DELIVERED')
    expect(latest.currentState.spikeCount).toBe(1)
    const v3 = await api.getShipment('CONT-DEMO-001', { version: 3 })
    expect(v3.currentState.status).toBe('SHIPPED')
    expect(v3.isHistorical).toBe(true)
    const metrics = await api.getMetrics('CONT-DEMO-001')
    expect(metrics.spikes).toHaveLength(1)
    expect(metrics.threshold).toBe(8)
    expect((await api.verify('CONT-DEMO-001')).valid).toBe(true)
  })

  it('creates a shipment, rejects a stale write with 409, and rejects an illegal transition with 422', async () => {
    const created = await api.move({ aggregateId: id, eventType: 'ShipmentCreated', payload: { origin: 'Pune' }, expectedVersion: 0, idempotencyKey: `${id}-1` })
    expect(created.event.version).toBe(1)

    const replay = await api.move({ aggregateId: id, eventType: 'ShipmentCreated', payload: { origin: 'Pune' }, expectedVersion: 0, idempotencyKey: `${id}-1` })
    expect(replay.replayed).toBe(true)

    await api.move({ aggregateId: id, eventType: 'ShipmentPacked', payload: {}, expectedVersion: 1 })
    const stale = await api.move({ aggregateId: id, eventType: 'ShipmentShipped', payload: {}, expectedVersion: 1 }).catch((e) => e)
    expect(stale).toBeInstanceOf(ApiError)
    expect([stale.status, stale.code, stale.details.currentVersion]).toEqual([409, 'VERSION_CONFLICT', 2])

    const illegal = await api.move({ aggregateId: id, eventType: 'ShipmentDelivered', payload: {}, expectedVersion: 2 }).catch((e) => e)
    expect([illegal.status, illegal.code]).toEqual([422, 'INVALID_TRANSITION'])
    expect(illegal.details.allowedNext).toContain('ShipmentShipped')
  })

  it('an unknown shipment is a 404 ApiError', async () => {
    const err = await api.getShipment('no-such-shipment').catch((e) => e)
    expect(err.status).toBe(404)
  })
})
