import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eventLabel, formatDateTime } from '../lib/format'

const dayLabel = (ms) => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Sensor readings overlaid on the lifecycle timeline. `upToVersion` keeps it in sync with time travel. */
function TemperatureChart({ metrics, upToVersion, t }) {
  const limit = upToVersion ?? Infinity
  const points = (metrics?.points ?? [])
    .filter((p) => p.version <= limit)
    .map((p) => ({ ...p, time: new Date(p.timestamp).getTime() }))
  const markers = (metrics?.markers ?? [])
    .filter((m) => m.version <= limit)
    .map((m) => ({ ...m, time: new Date(m.timestamp).getTime() }))

  if (points.length === 0) {
    return (
      <section aria-label="Temperature" className={`rounded-xl border border-dashed p-5 text-center text-sm ${t.dashed}`}>
        No temperature readings recorded yet.
      </section>
    )
  }

  const times = [...points, ...markers].map((x) => x.time)
  const threshold = metrics.threshold
  const temps = points.map((p) => p.temperature)
  const yMin = Math.floor(Math.min(...temps, threshold ?? Infinity) - 1)
  const yMax = Math.ceil(Math.max(...temps, threshold ?? -Infinity) + 1)

  const renderDot = ({ cx, cy, payload, key }) => (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={payload.spike ? 6 : 3.5}
      fill={payload.spike ? t.chart.spike : t.chart.line}
      stroke={payload.spike ? t.chart.spike : 'none'}
      strokeOpacity={0.35}
      strokeWidth={payload.spike ? 6 : 0}
    />
  )

  return (
    <section aria-label="Temperature" className={`rounded-xl border p-4 ${t.card}`}>
      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-2">
        <h3 className={`text-sm font-semibold ${t.text}`}>Temperature vs. events</h3>
        {metrics.stats && (
          <p className={`text-xs font-mono ${t.dim}`}>
            min {metrics.stats.min} · avg {metrics.stats.average} · max {metrics.stats.max} °C
          </p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <LineChart data={points} margin={{ top: 22, right: 16, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={t.chart.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[Math.min(...times), Math.max(...times)]}
            tickFormatter={dayLabel}
            stroke={t.chart.axis}
            tick={{ fontSize: 11 }}
          />
          <YAxis domain={[yMin, yMax]} unit="°" stroke={t.chart.axis} tick={{ fontSize: 11 }} width={44} />
          <Tooltip
            labelFormatter={(ms) => formatDateTime(ms)}
            formatter={(value) => [`${value} °C`, 'Temperature']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {threshold !== null && (
            <ReferenceLine y={threshold} stroke={t.chart.spike} strokeDasharray="5 4" label={{ value: `limit ${threshold}°`, fontSize: 10, fill: t.chart.spike, position: 'insideTopRight' }} />
          )}
          {markers.map((m) => (
            <ReferenceLine
              key={m.version}
              x={m.time}
              stroke={t.chart.marker}
              strokeOpacity={0.55}
              label={{ value: eventLabel(m.eventType), fontSize: 9, fill: t.chart.axis, position: 'top' }}
            />
          ))}
          <Line type="monotone" dataKey="temperature" stroke={t.chart.line} strokeWidth={2} dot={renderDot} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}

export default TemperatureChart
