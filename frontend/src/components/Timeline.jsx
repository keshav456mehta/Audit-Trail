import './Timeline.css'
import { eventLabel, formatDateTime, shortHash } from '../lib/format'

const FALLBACK_DOT = '#6B7280'

function Timeline({ events, viewVersion, t }) {
  const cutoff = viewVersion ?? Infinity

  return (
    <section aria-label="Event history">
      <h2 className={`text-sm font-semibold mb-4 ${t.dim}`}>Event history · {events.length} events</h2>
      <ol className="relative pl-6">
        <div className={`absolute left-[7px] top-1 bottom-1 w-px ${t.rule}`} aria-hidden="true" />
        <div className="space-y-3">
          {events.map((event, i) => {
            const color = t.events[event.eventType] ?? FALLBACK_DOT
            const future = event.version > cutoff
            return (
              <li
                key={event.id}
                className={`event-card relative transition-opacity ${future ? 'opacity-35' : ''}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                aria-label={future ? `${eventLabel(event.eventType)} (after the selected point in time)` : undefined}
              >
                <div className={`absolute -left-6 top-4 w-3 h-3 rounded-full border-2 ${t.dotBorder}`} style={{ backgroundColor: color }} />
                <div className={`rounded-lg p-4 border transition-colors ${t.card} ${t.cardHover}`}>
                  <div className="flex flex-wrap justify-between items-center gap-1 mb-1">
                    <span className="font-semibold text-sm" style={{ color }}>
                      {eventLabel(event.eventType)}
                    </span>
                    <span className={`text-xs font-mono ${t.faint}`}>{formatDateTime(event.timestamp)}</span>
                  </div>
                  <p className={`text-xs font-mono break-all ${t.dim}`}>{JSON.stringify(event.payload)}</p>
                  <p className={`text-[11px] font-mono mt-1 ${t.faint}`} title={event.hash}>
                    v{event.version} · #{shortHash(event.hash)}
                  </p>
                </div>
              </li>
            )
          })}
        </div>
      </ol>
    </section>
  )
}

export default Timeline
