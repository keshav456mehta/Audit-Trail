import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import Timeline from './components/Timeline'

function App() {
  const [events, setEvents] = useState(null)
  const [shipmentId, setShipmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SearchBar
          onSearchStart={() => {
            setLoading(true)
            setError('')
            setEvents(null)
          }}
          onSearchResults={(data) => {
            setLoading(false)
            setEvents(data.events)
            setShipmentId(data.shipmentId)
          }}
          onSearchError={(msg) => {
            setLoading(false)
            setError(msg)
          }}
        />
        <Timeline events={events} shipmentId={shipmentId} loading={loading} error={error} />
      </main>
    </div>
  )
}

export default App
