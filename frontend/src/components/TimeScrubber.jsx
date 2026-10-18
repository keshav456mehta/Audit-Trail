import { formatDateTime, relativeTime } from '../lib/format'

/** "Rewind time": pick any version and the page shows the shipment exactly as it was then. */
function TimeScrubber({ events, viewVersion, onChange, t }) {
  const latest = events.length
  if (latest < 2) return null
  const value = viewVersion ?? latest
  const event = events[value - 1]
  const atLatest = viewVersion === null

  return (
    <section aria-label="Time travel" className={`rounded-xl border p-4 ${t.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className={`text-sm font-semibold ${t.text}`}>Rewind time</h3>
        <p className={`text-xs font-mono ${t.dim}`} aria-live="polite">
          {atLatest ? 'Latest' : `v${value} of ${latest}`} · {formatDateTime(event.timestamp)} ({relativeTime(event.timestamp)})
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Previous event" disabled={value <= 1} onClick={() => onChange(value - 1)} className={`px-2.5 py-1 rounded-lg text-sm ${t.btnGhost}`}>
          ◀
        </button>
        <input
          type="range"
          aria-label="Event version"
          min={1}
          max={latest}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: t.accent }}
        />
        <button aria-label="Next event" disabled={atLatest} onClick={() => onChange(value + 1)} className={`px-2.5 py-1 rounded-lg text-sm ${t.btnGhost}`}>
          ▶
        </button>
        <button disabled={atLatest} onClick={() => onChange(latest)} className={`px-3 py-1 rounded-lg text-xs ${t.btnGhost}`}>
          Latest
        </button>
      </div>
    </section>
  )
}

export default TimeScrubber
