import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../api/client'
import { events, integrityOk, latestState, metricsResponse, shipmentResponse } from './fixtures'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    api: {
      login: vi.fn(),
      me: vi.fn(),
      getShipment: vi.fn(),
      getMetrics: vi.fn(),
      verify: vi.fn(),
      listShipments: vi.fn(),
      stats: vi.fn(),
      move: vi.fn(),
    },
  }
})

const { api, setToken } = await import('../api/client')
const { default: App } = await import('../App')

const operator = { username: 'operator', role: 'operator' }

function signedIn(user = operator) {
  setToken('test-token')
  api.me.mockResolvedValue({ user })
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listShipments.mockResolvedValue({ items: [{ shipmentId: 'CONT-1', status: 'SHIPPED', version: 5, lastEventAt: events[4].timestamp }] })
  api.stats.mockResolvedValue({ total: 1, spikes: 1, byStatus: { CREATED: 0, PACKED: 0, SHIPPED: 1, ARRIVED_AT_PORT: 0, DELIVERED: 0 } })
  api.getShipment.mockImplementation(async (id, { version } = {}) =>
    version === undefined
      ? shipmentResponse
      : { ...shipmentResponse, isHistorical: true, currentState: { ...latestState, status: 'PACKED', version } },
  )
  api.getMetrics.mockResolvedValue(metricsResponse)
  api.verify.mockResolvedValue(integrityOk)
})

describe('App', () => {
  // Regression guard: the previous submission crashed on import (hooks at module level in Timeline.jsx).
  it('renders the sign-in screen instead of a blank page', () => {
    render(<App />)
    expect(screen.getByRole('form', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByText('Audit Trail')).toBeInTheDocument()
  })

  it('shows a readable error for wrong credentials', async () => {
    api.login.mockRejectedValue(new ApiError({ status: 401, code: 'BAD_CREDENTIALS', message: 'Incorrect username or password' }))
    render(<App />)
    await userEvent.type(screen.getByLabelText('Username'), 'operator')
    await userEvent.type(screen.getByLabelText('Password'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect username or password')
  })

  it('logs in, lists recent shipments, opens one, and shows state, integrity, chart and history', async () => {
    api.login.mockResolvedValue({ token: 't', user: operator })
    render(<App />)
    await userEvent.type(screen.getByLabelText('Username'), 'operator')
    await userEvent.type(screen.getByLabelText('Password'), 'operator-pass-123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await userEvent.click(await screen.findByRole('button', { name: /CONT-1/ }))
    expect(await screen.findByText(/Hash chain intact/)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Shipment state' })).toBeInTheDocument()
    expect(await screen.findByRole('region', { name: 'Temperature' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Event history' })).getAllByRole('listitem')).toHaveLength(5)
  })

  it('time travel asks the server for the past state', async () => {
    signedIn()
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'CONT-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    const slider = await screen.findByLabelText('Event version')

    fireEvent.change(slider, { target: { value: '2' } })
    await waitFor(() => expect(api.getShipment).toHaveBeenCalledWith('CONT-1', { version: 2 }))
    expect(await screen.findByText(/state as of v2/)).toBeInTheDocument()
    // recording is disabled while looking at the past
    expect(screen.getByText(/Viewing the past/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Latest' }))
    expect(await screen.findByRole('form', { name: 'Record event' })).toBeInTheDocument()
  })

  it('sends expectedVersion + an idempotency key, then reloads and refreshes the list', async () => {
    signedIn()
    api.move.mockResolvedValue({ success: true })
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'CONT-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    await screen.findByRole('form', { name: 'Record event' })

    const form = screen.getByRole('form', { name: 'Record event' })
    await userEvent.selectOptions(within(form).getByLabelText('Event'), 'ShipmentTemperatureRecorded')
    await userEvent.type(within(form).getByLabelText(/Temperature/), '4.4')
    await userEvent.click(screen.getByRole('button', { name: 'Record event' }))

    await waitFor(() => expect(api.move).toHaveBeenCalledTimes(1))
    expect(api.move.mock.calls[0][0]).toMatchObject({
      aggregateId: 'CONT-1',
      eventType: 'ShipmentTemperatureRecorded',
      payload: { temperature: 4.4 },
      expectedVersion: 5,
    })
    expect(api.move.mock.calls[0][0].idempotencyKey).toMatch(/^[A-Za-z0-9._:-]{8,128}$/)
    await waitFor(() => expect(api.listShipments.mock.calls.length).toBeGreaterThan(1))
  })

  it('handles a version conflict by telling the user and offering a reload', async () => {
    signedIn()
    api.move.mockRejectedValue(new ApiError({ status: 409, code: 'VERSION_CONFLICT', message: 'The shipment changed since you loaded it. Reload and retry.', details: { currentVersion: 6 } }))
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'CONT-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    await screen.findByRole('form', { name: 'Record event' })
    await userEvent.selectOptions(screen.getByLabelText('Event'), 'ShipmentArrivedAtPort')
    await userEvent.click(screen.getByRole('button', { name: 'Record event' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/changed since you loaded/)
    expect(screen.getByRole('button', { name: 'Reload latest' })).toBeInTheDocument()
  })

  it('offers to create an unknown shipment (operators) and does not (viewers)', async () => {
    api.getShipment.mockRejectedValue(new ApiError({ status: 404, code: 'SHIPMENT_NOT_FOUND', message: 'none' }))
    signedIn()
    const { unmount } = render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'NEW-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    expect(await screen.findByText('Shipment not found')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Record event' })).toBeInTheDocument()
    unmount()

    signedIn({ username: 'viewer', role: 'viewer' })
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'NEW-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    expect(await screen.findByText('Shipment not found')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'Record event' })).not.toBeInTheDocument()
  })

  it('shows a server/network error with a retry instead of a blank state', async () => {
    api.getShipment.mockRejectedValue(new ApiError({ code: 'NETWORK', message: 'Cannot reach the server. Is the backend running?' }))
    signedIn()
    render(<App />)
    await userEvent.type(await screen.findByLabelText('Shipment ID'), 'CONT-1')
    await userEvent.click(screen.getByRole('button', { name: 'Track' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot reach the server/)
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('switches themes', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: /Radar/ }))
    expect(screen.getByRole('radio', { name: /Radar/ })).toHaveAttribute('aria-checked', 'true')
  })
})
