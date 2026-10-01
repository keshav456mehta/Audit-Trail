import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import Timeline from './components/Timeline'
import CometField from './components/CometField'
import IntegrationChecklist from './components/IntegrationChecklist'

const THEMES = [
  { id: 'light', label: 'Daylight', swatch: '#C2703D' },
  { id: 'comet', label: 'Comet', swatch: '#8B5CF6' },
  { id: 'radar', label: 'Radar', swatch: '#F59E0B' },
]

function App() {
  const [events, setEvents] = useState(null)
  const [shipmentId, setShipmentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState('light')

  const isLight = theme === 'light'
  const fontClass = isLight ? 'font-serif-warm' : ''

  return (
    <div className={`min-h-screen relative ${isLight ? 'bg-[#FAF6EE]' : 'bg-black'} ${fontClass}`}>
      {theme === 'comet' && <CometField />}
      {theme === 'radar' && <div className="bg-grid"></div>}

      <div className="content-layer">
        <Header light={isLight} />

        <div className="max-w-2xl mx-auto px-6 pt-6">
          <div className={`inline-flex gap-1 p-1 rounded-xl border ${isLight ? 'border-[#E8DFC9] bg-white/60' : 'border-[#262626] bg-[#0F0F0F]/60'}`}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  theme === t.id
                    ? isLight
                      ? 'bg-[#3B3021] text-white'
                      : 'bg-white text-black'
                    : isLight
                    ? 'text-[#8A7F6A] hover:bg-[#F0E9D8]'
                    : 'text-[#9CA3AF] hover:bg-[#1F2937]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.swatch }}></span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-6 py-10">
          <IntegrationChecklist light={isLight} />
          <SearchBar
            light={isLight}
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
          <Timeline events={events} shipmentId={shipmentId} loading={loading} error={error} light={isLight} />
        </main>
      </div>
    </div>
  )
}

export default App
