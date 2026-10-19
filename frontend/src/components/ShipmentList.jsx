import { relativeTime, statusLabel } from '../lib/format'

function ShipmentList({ items, stats, onPick, t }) {
  if (!items) return null
  return (
    <section aria-label="Recent shipments" className="mt-8">
      {stats && (
        <p className={`text-xs font-mono mb-3 ${t.dim}`}>
          {stats.total} shipments · {Object.entries(stats.byStatus).filter(([, n]) => n > 0).map(([s, n]) => `${n} ${statusLabel(s).toLowerCase()}`).join(' · ')}
          {stats.spikes > 0 && <span className={t.bad}> · {stats.spikes} temperature spike{stats.spikes > 1 ? 's' : ''}</span>}
        </p>
      )}
      {items.length === 0 ? (
        <p className={`text-sm ${t.faint}`}>No shipments yet. Search for a new ID to create one.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.shipmentId}>
              <button
                onClick={() => onPick(item.shipmentId)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${t.card} ${t.cardHover}`}
              >
                <span className={`block font-mono text-sm ${t.text}`}>{item.shipmentId}</span>
                <span className={`block text-xs ${t.dim}`}>
                  {statusLabel(item.status)} · v{item.version} · {relativeTime(item.lastEventAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ShipmentList
