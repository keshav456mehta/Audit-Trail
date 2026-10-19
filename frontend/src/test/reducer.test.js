import { describe, expect, it } from 'vitest'
import { displayedState, initialShipmentState, shipmentReducer } from '../hooks/shipmentReducer'
import { latestState, metricsResponse, shipmentResponse } from './fixtures'

const ready = shipmentReducer(shipmentReducer(initialShipmentState, { type: 'LOAD_START', id: 'CONT-1' }), {
  type: 'LOAD_OK',
  data: shipmentResponse,
  metrics: metricsResponse,
})

describe('shipmentReducer', () => {
  it('loads into the ready phase at the latest version', () => {
    expect(ready.phase).toBe('ready')
    expect(ready.viewVersion).toBeNull()
    expect(displayedState(ready)).toBe(latestState)
  })

  it('scrubbing to an earlier version enters time travel; scrubbing to the end leaves it', () => {
    const past = shipmentReducer(ready, { type: 'SCRUB', version: 2 })
    expect(past.viewVersion).toBe(2)
    expect(past.historicalLoading).toBe(true)
    const back = shipmentReducer(past, { type: 'SCRUB', version: 5 })
    expect(back.viewVersion).toBeNull()
    expect(back.historical).toBeNull()
  })

  it('shows the server-provided past state once it arrives', () => {
    const past = shipmentReducer(ready, { type: 'SCRUB', version: 2 })
    const loaded = shipmentReducer(past, { type: 'HISTORICAL_OK', version: 2, state: { ...latestState, status: 'PACKED', version: 2 } })
    expect(displayedState(loaded).status).toBe('PACKED')
    expect(loaded.historicalLoading).toBe(false)
  })

  it('ignores a stale historical response (user already moved the slider)', () => {
    const moved = shipmentReducer(shipmentReducer(ready, { type: 'SCRUB', version: 2 }), { type: 'SCRUB', version: 3 })
    const afterStale = shipmentReducer(moved, { type: 'HISTORICAL_OK', version: 2, state: { ...latestState, status: 'PACKED' } })
    expect(afterStale).toBe(moved)
  })

  it('tracks a command error and clears it on dismiss', () => {
    const failed = shipmentReducer(ready, { type: 'COMMAND_ERROR', error: { kind: 'conflict', message: 'changed' } })
    expect(failed.command.error.kind).toBe('conflict')
    expect(shipmentReducer(failed, { type: 'DISMISS_ERROR' }).command.error).toBeNull()
  })

  it('represents an unknown shipment as notFound', () => {
    expect(shipmentReducer(ready, { type: 'LOAD_NOT_FOUND', id: 'NOPE' }).phase).toBe('notFound')
  })
})
