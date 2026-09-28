import { useState } from 'react'

function SearchBar({ onSearchResults, onSearchStart, onSearchError, light }) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    onSearchStart()

    try {
      const res = await fetch(`http://localhost:5000/shipment/${searchValue}`)
      const data = await res.json()
      onSearchResults(data)
    } catch (err) {
      onSearchError('Failed to fetch shipment data')
      console.error(err)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Enter shipment ID..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className={`font-mono flex-1 rounded-lg px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-1 ${
          light
            ? 'bg-white border border-[#E8DFC9] text-[#3B3021] placeholder-[#B3A88F] focus:border-[#C2703D] focus:ring-[#C2703D]'
            : 'bg-[#111827] border border-[#1F2937] text-[#E5E7EB] placeholder-[#6B7280] focus:border-[#14B8A6] focus:ring-[#14B8A6]'
        }`}
      />
      <button
        onClick={handleSearch}
        disabled={!searchValue.trim()}
        className={`font-semibold px-5 py-3 rounded-lg text-sm transition-colors ${
          light
            ? 'bg-[#C2703D] hover:bg-[#A85E30] disabled:bg-[#EDE6D3] disabled:text-[#B3A88F] text-white'
            : 'bg-[#14B8A6] hover:bg-[#0d9488] disabled:bg-[#1F2937] disabled:text-[#6B7280] text-black'
        }`}
      >
        Track
      </button>
    </div>
  )
}

export default SearchBar
