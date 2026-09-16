import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import Timeline from './components/Timeline'

function App() {
  const [events, setEvents] = useState(null)
  const [shipmentId, setShipmentId] = useState('')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SearchBar onSearchResults={(data) => {
          setEvents(data.events)
          setShipmentId(data.shipmentId)
        }} />
        {events && <Timeline events={events} shipmentId={shipmentId} />}
      </main>
    </div>
  )
}

export default App
