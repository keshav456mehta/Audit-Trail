import { useState } from 'react'

function SearchBar() {
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchValue.trim()) return
    setError('')
    setResults(null)

    try {
      const res = await fetch(`http://localhost:5000/shipment/${searchValue}`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError('Failed to fetch shipment data')
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

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {results && (
        <pre style={{ textAlign: 'left', marginTop: '1rem' }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default SearchBar
