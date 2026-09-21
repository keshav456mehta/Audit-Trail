import { useState } from 'react'

function SearchBar({ onSearch }) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = () => {
    if (!searchValue.trim()) return
    console.log('Searching for container:', searchValue)
    onSearch(searchValue)
    // TODO: connect this to the actual CQRS query route
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