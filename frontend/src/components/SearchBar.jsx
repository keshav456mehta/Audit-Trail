import { useState } from 'react'

function SearchBar() {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = () => {
    console.log('Searching for container:', searchValue)
    // TODO: connect this to the query API route in a later phase
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