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
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search by Container ID..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  )
}

export default SearchBar
