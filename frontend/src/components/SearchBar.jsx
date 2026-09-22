import { useState } from 'react'

function SearchBar({ onSearchResults, onSearchStart, onSearchError }) {
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
    <div className="flex items-center gap-2 p-4">
      <input
        type="text"
        placeholder="Search by Container ID..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleSearch}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        disabled={!searchValue.trim()}
      >
        Search
      </button>
    </div>
  )
}

export default SearchBar
