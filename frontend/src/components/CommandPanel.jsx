import { useState } from 'react'
import { FIELDS, buildPayload, typeLabel } from '../lib/commandFields'

function CommandPanel({ allowedNext, latestVersion, command, readOnly, historical, onSubmit, onReload, t }) {
  const [selected, setSelected] = useState('')
  const [values, setValues] = useState({})
  const [localError, setLocalError] = useState('')

  if (readOnly) {
    return <p className={`text-xs ${t.faint}`}>You have read-only access. Ask an operator to record events.</p>
  }
  if (historical) {
    return <p className={`text-xs ${t.faint}`}>Viewing the past. Return to “Latest” to record a new event.</p>
  }
  if (allowedNext.length === 0) {
    return <p className={`text-xs ${t.faint}`}>This shipment is delivered. The ledger is closed for new events.</p>
  }

  const eventType = allowedNext.includes(selected) ? selected : allowedNext[0]
  const fields = FIELDS[eventType] ?? []

  const submit = async (event) => {
    event.preventDefault()
    const { payload, error } = buildPayload(eventType, values)
    setLocalError(error ?? '')
    if (error) return
    if (await onSubmit({ eventType, payload })) setValues({})
  }

  const changeType = (value) => {
    setSelected(value)
    setValues({})
    setLocalError('')
  }

  const message = localError || command.error?.message

  return (
    <form onSubmit={submit} aria-label="Record event" className={`rounded-xl border p-4 space-y-3 ${t.card}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`text-sm font-semibold ${t.text}`}>Record next event</h3>
        <span className={`text-xs font-mono ${t.faint}`}>based on v{latestVersion}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className={`text-xs ${t.dim}`}>Event</span>
          <select
            value={eventType}
            onChange={(e) => changeType(e.target.value)}
            className={`mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 ${t.input}`}
          >
            {allowedNext.map((type) => (
              <option key={type} value={type}>
                {typeLabel(type)}
              </option>
            ))}
          </select>
        </label>
        {fields.map((field) => (
          <label key={`${eventType}-${field.name}`} className="block">
            <span className={`text-xs ${t.dim}`}>
              {field.label}
              {field.required && ' *'}
            </span>
            <input
              inputMode={field.number ? 'decimal' : 'text'}
              value={values[field.name] ?? field.initial ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              className={`mt-1 w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 ${t.input}`}
            />
          </label>
        ))}
      </div>

      {message && (
        <div role="alert" className={`text-sm rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 ${command.error?.kind === 'conflict' ? t.warn : t.danger}`}>
          <span>{message}</span>
          {command.error?.kind === 'conflict' && (
            <button type="button" onClick={onReload} className={`text-xs px-2 py-1 rounded-md ${t.btnGhost}`}>
              Reload latest
            </button>
          )}
        </div>
      )}

      <button type="submit" disabled={command.busy} className={`font-semibold px-5 py-2 rounded-lg text-sm transition-colors ${t.btn}`}>
        {command.busy ? 'Recording…' : 'Record event'}
      </button>
    </form>
  )
}

export default CommandPanel
