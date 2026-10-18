import { useState } from 'react'

function SearchBar({ onSearch, busy, t }) {
  const [value, setValue] = useState('')
  const submit = () => value.trim() && onSearch(value)

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        aria-label="Shipment ID"
        placeholder="Enter shipment ID…"
        value={value}
        maxLength={64}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className={`font-mono flex-1 rounded-lg px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-1 ${t.input}`}
      />
      <button
        onClick={submit}
        disabled={!value.trim() || busy}
        className={`font-semibold px-5 py-3 rounded-lg text-sm transition-colors ${t.btn}`}
      >
        Track
      </button>
    </div>
  )
}

export default SearchBar
