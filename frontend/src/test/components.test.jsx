import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { getTheme } from '../theme'
import Timeline from '../components/Timeline'
import TimeScrubber from '../components/TimeScrubber'
import StateSummary from '../components/StateSummary'
import IntegrityBadge from '../components/IntegrityBadge'
import TemperatureChart from '../components/TemperatureChart'
import CommandPanel from '../components/CommandPanel'
import { events, integrityOk, latestState, metricsResponse } from './fixtures'

const t = getTheme('light')

describe('Timeline', () => {
  it('renders every event with version and short hash, without crashing', () => {
    render(<Timeline events={events} viewVersion={null} t={t} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText(/Mumbai Port/)).toBeInTheDocument()
    expect(screen.getByText(/v3 · #h3/)).toBeInTheDocument()
  })

  it('dims events that happened after the selected point in time', () => {
    render(<Timeline events={events} viewVersion={2} t={t} />)
    expect(screen.getAllByLabelText(/after the selected point in time/)).toHaveLength(3)
  })
})

describe('TimeScrubber', () => {
  it('reports slider and button changes', () => {
    const onChange = vi.fn()
    render(<TimeScrubber events={events} viewVersion={null} onChange={onChange} t={t} />)
    fireEvent.change(screen.getByLabelText('Event version'), { target: { value: '2' } })
    expect(onChange).toHaveBeenLastCalledWith(2)
    fireEvent.click(screen.getByLabelText('Previous event'))
    expect(onChange).toHaveBeenLastCalledWith(4)
  })

  it('disables "next" at the latest version and is hidden for single-event shipments', () => {
    const { rerender, container } = render(<TimeScrubber events={events} viewVersion={null} onChange={() => {}} t={t} />)
    expect(screen.getByLabelText('Next event')).toBeDisabled()
    rerender(<TimeScrubber events={events.slice(0, 1)} viewVersion={null} onChange={() => {}} t={t} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('StateSummary', () => {
  it('shows the current facts', () => {
    render(<StateSummary state={latestState} historical={false} loading={false} t={t} />)
    expect(screen.getByText('CONT-1')).toBeInTheDocument()
    expect(screen.getByText(/MSC Aurora/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Progress: Shipped/ })).toBeInTheDocument()
  })

  it('explains when the shipment did not exist yet', () => {
    render(<StateSummary state={{ ...latestState, exists: false }} historical loading={false} t={t} />)
    expect(screen.getByText(/did not exist yet/)).toBeInTheDocument()
  })
})

describe('IntegrityBadge', () => {
  it('shows an intact chain', () => {
    render(<IntegrityBadge integrity={integrityOk} onVerify={() => {}} t={t} />)
    expect(screen.getByText(/Hash chain intact/)).toBeInTheDocument()
  })

  it('shouts when tampering is detected', () => {
    render(<IntegrityBadge integrity={{ valid: false, reason: 'EVENT_CONTENT_MODIFIED', brokenAtVersion: 4 }} onVerify={() => {}} t={t} />)
    expect(screen.getByText(/Tampering detected/)).toBeInTheDocument()
    expect(screen.getByText(/changed after it was written/)).toBeInTheDocument()
  })
})

describe('TemperatureChart', () => {
  it('handles shipments with no readings', () => {
    render(<TemperatureChart metrics={{ points: [], markers: [], threshold: null, stats: null }} upToVersion={null} t={t} />)
    expect(screen.getByText(/No temperature readings/)).toBeInTheDocument()
  })

  it('renders with data and respects the time-travel cutoff without crashing', () => {
    const { rerender } = render(<TemperatureChart metrics={metricsResponse} upToVersion={null} t={t} />)
    expect(screen.getByText(/Temperature vs. events/)).toBeInTheDocument()
    rerender(<TemperatureChart metrics={metricsResponse} upToVersion={2} t={t} />) // before any reading
    expect(screen.getByText(/No temperature readings/)).toBeInTheDocument()
  })
})

describe('CommandPanel', () => {
  const base = { latestVersion: 5, command: { busy: false, error: null }, onReload: () => {}, t }

  it('offers only the events the backend says are allowed and submits a built payload', async () => {
    const onSubmit = vi.fn().mockResolvedValue(true)
    render(<CommandPanel {...base} allowedNext={['ShipmentTemperatureRecorded', 'ShipmentArrivedAtPort']} onSubmit={onSubmit} />)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Temperature Recorded', 'Arrived At Port'])
    fireEvent.change(screen.getByLabelText(/Temperature/), { target: { value: '5.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Record event' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ eventType: 'ShipmentTemperatureRecorded', payload: { temperature: 5.5 } }))
    await waitFor(() => expect(screen.getByLabelText(/Temperature/)).toHaveValue('')) // form resets after success
  })

  it('validates required fields locally before calling the server', () => {
    const onSubmit = vi.fn()
    render(<CommandPanel {...base} allowedNext={['ShipmentTemperatureRecorded']} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record event' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/required/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('offers "Reload latest" on a version conflict', () => {
    const onReload = vi.fn()
    render(
      <CommandPanel {...base} onReload={onReload} allowedNext={['ShipmentPacked']} onSubmit={() => {}}
        command={{ busy: false, error: { kind: 'conflict', message: 'The shipment changed since you loaded it.' } }} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Reload latest' }))
    expect(onReload).toHaveBeenCalled()
  })

  it('is read-only for viewers, closed for delivered shipments, and disabled while time-travelling', () => {
    const { rerender } = render(<CommandPanel {...base} allowedNext={['ShipmentPacked']} readOnly onSubmit={() => {}} />)
    expect(screen.getByText(/read-only access/)).toBeInTheDocument()
    rerender(<CommandPanel {...base} allowedNext={[]} onSubmit={() => {}} />)
    expect(screen.getByText(/ledger is closed/)).toBeInTheDocument()
    rerender(<CommandPanel {...base} allowedNext={['ShipmentPacked']} historical onSubmit={() => {}} />)
    expect(screen.getByText(/Viewing the past/)).toBeInTheDocument()
  })
})
