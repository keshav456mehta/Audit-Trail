import './Timeline.css'
import { formatTemp, relativeTime, statusLabel } from '../lib/format'

const STAGES = ['CREATED', 'PACKED', 'SHIPPED', 'ARRIVED_AT_PORT', 'DELIVERED']

function ProgressStepper({ status, t }) {
  const currentIndex = STAGES.indexOf(status)
  const fillPercent = currentIndex >= 0 ? (currentIndex / (STAGES.length - 1)) * 100 : 0

  return (
    <div className="mb-8 px-2" role="img" aria-label={`Progress: ${statusLabel(status)}`}>
      <div className={`relative h-1.5 rounded-full mb-6 ${t.track}`}>
        <div className={`stage-fill absolute inset-y-0 left-0 bg-gradient-to-r ${t.fill} rounded-full`} style={{ width: `${fillPercent}%` }} />
      </div>
      <div className="flex justify-between">
        {STAGES.map((stage, i) => {
          const done = i <= currentIndex
          return (
            <div key={stage} className="flex flex-col items-center gap-2 flex-1">
              <div
                className={`w-4 h-4 rounded-full border-2 ${i === currentIndex ? 'stage-active' : ''}`}
                style={{
                  backgroundColor: done ? t.accent : t.stepOff.bg,
                  borderColor: done ? t.accent : t.stepOff.border,
                }}
              />
              <span className={`text-[11px] font-mono text-center ${done ? t.text : t.stepOff.text}`}>{statusLabel(stage)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Fact({ label, children, t }) {
  return (
    <div>
      <dt className={`text-xs ${t.faint}`}>{label}</dt>
      <dd className={`text-sm font-mono break-words ${t.text}`}>{children}</dd>
    </div>
  )
}

function StateSummary({ state, historical, loading, t }) {
  if (!state?.exists) {
    return (
      <div className={`rounded-xl border border-dashed p-6 text-center text-sm ${t.dashed}`}>
        This shipment did not exist yet at this point in time.
      </div>
    )
  }
  return (
    <section aria-label="Shipment state" className={`rounded-xl border p-5 ${t.card}`}>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className={`font-mono font-semibold ${t.text}`}>{state.shipmentId}</h2>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.accent, color: t.light ? '#fff' : '#000' }}>
          {statusLabel(state.status)}
        </span>
        {historical && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${t.warn}`}>
            {loading ? 'loading past state…' : `state as of v${state.version}`}
          </span>
        )}
      </div>
      <ProgressStepper status={state.status} t={t} />
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Fact label="Route" t={t}>{state.origin ?? '-'} → {state.destination ?? '-'}</Fact>
        <Fact label="Vessel" t={t}>{state.vessel ?? '-'}</Fact>
        <Fact label="Temperature" t={t}>
          {formatTemp(state.currentTemperature)}
          {state.maxTemperature !== null && <span className={`block text-xs ${t.faint}`}>peak {formatTemp(state.maxTemperature)}</span>}
        </Fact>
        <Fact label="Spikes" t={t}>
          <span className={state.spikeCount ? t.bad : ''}>{state.spikeCount}</span>
        </Fact>
        <Fact label="Version" t={t}>v{state.version} · {state.eventCount} events</Fact>
        <Fact label="Last event" t={t}>{relativeTime(state.lastEventAt)}</Fact>
      </dl>
    </section>
  )
}

export default StateSummary
