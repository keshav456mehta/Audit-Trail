import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { api } from './api/client'
import { useAuth } from './hooks/useAuth'
import { useShipment } from './hooks/useShipment'
import { displayedState } from './hooks/shipmentReducer'
import { getTheme } from './theme'
import CometField from './components/CometField'
import CommandPanel from './components/CommandPanel'
import Header from './components/Header'
import IntegrityBadge from './components/IntegrityBadge'
import LoginForm from './components/LoginForm'
import SearchBar from './components/SearchBar'
import ShipmentList from './components/ShipmentList'
import StateSummary from './components/StateSummary'
import ThemeSwitch from './components/ThemeSwitch'
import TimeScrubber from './components/TimeScrubber'
import Timeline from './components/Timeline'

// recharts is the heaviest dependency: load it only when a shipment is actually opened
const TemperatureChart = lazy(() => import('./components/TemperatureChart'))

function Notice({ t, children, tone = 'dashed' }) {
  const style = tone === 'danger' ? t.danger : `border-dashed ${t.dashed}`
  return <div className={`mt-10 text-center py-12 px-4 rounded-xl border text-sm ${style}`}>{children}</div>
}

function Dashboard({ t, user }) {
  const [recent, setRecent] = useState({ items: null, stats: null })
  const [recentKey, setRecentKey] = useState(0)
  const refreshRecent = useCallback(() => setRecentKey((k) => k + 1), [])
  const { state, load, reload, scrub, runCommand, verify } = useShipment({ onChanged: refreshRecent })

  useEffect(() => {
    let cancelled = false
    Promise.all([api.listShipments({ limit: 8 }), api.stats()])
      .then(([list, stats]) => !cancelled && setRecent({ items: list.items, stats }))
      .catch(() => !cancelled && setRecent({ items: [], stats: null }))
    return () => {
      cancelled = true
    }
  }, [recentKey])

  const canWrite = user.role === 'operator' || user.role === 'admin'
  const { phase, data, metrics, integrity, viewVersion, historicalLoading, command } = state
  const shown = displayedState(state)
  const isHistorical = viewVersion !== null

  return (
    <>
      <SearchBar t={t} onSearch={load} busy={phase === 'loading'} />

      {phase === 'idle' && <ShipmentList items={recent.items} stats={recent.stats} onPick={load} t={t} />}
      {phase === 'loading' && <Notice t={t}>Searching…</Notice>}
      {phase === 'error' && (
        <Notice t={t} tone="danger">
          <p role="alert">{state.error}</p>
          <button onClick={reload} className={`mt-3 text-xs px-3 py-1.5 rounded-lg ${t.btnGhost}`}>
            Try again
          </button>
        </Notice>
      )}

      {phase === 'notFound' && (
        <div className="mt-8 space-y-4">
          <Notice t={t}>
            <h3 className={`font-semibold mb-1 ${t.bad}`}>Shipment not found</h3>
            No records for <span className={`font-mono ${t.text}`}>“{state.id}”</span>. Check the ID{canWrite ? ' or create it below.' : '.'}
          </Notice>
          <CommandPanel
            t={t}
            allowedNext={['ShipmentCreated']}
            latestVersion={0}
            command={command}
            readOnly={!canWrite}
            onSubmit={runCommand}
            onReload={reload}
          />
        </div>
      )}

      {phase === 'ready' && data && (
        <div className="mt-8 space-y-5">
          <IntegrityBadge integrity={integrity} onVerify={verify} t={t} />
          <StateSummary state={shown} historical={isHistorical} loading={historicalLoading} t={t} />
          <TimeScrubber events={data.events} viewVersion={viewVersion} onChange={scrub} t={t} />
          <Suspense fallback={<Notice t={t}>Loading chart…</Notice>}>
            <TemperatureChart metrics={metrics} upToVersion={viewVersion} t={t} />
          </Suspense>
          <CommandPanel
            t={t}
            allowedNext={data.currentState.allowedNext}
            latestVersion={data.latestVersion}
            command={command}
            readOnly={!canWrite}
            historical={isHistorical}
            onSubmit={runCommand}
            onReload={reload}
          />
          <Timeline events={data.events} viewVersion={viewVersion} t={t} />
        </div>
      )}
    </>
  )
}

function App() {
  const [theme, setTheme] = useState('light')
  const t = getTheme(theme)
  const auth = useAuth()

  return (
    <div className={`min-h-screen relative ${t.page}`}>
      {theme === 'comet' && <CometField />}
      {theme === 'radar' && <div className="bg-grid" />}

      <div className="content-layer">
        <Header t={t} user={auth.user} onLogout={auth.logout} />
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <ThemeSwitch theme={theme} onChange={setTheme} t={t} />
        </div>
        <main className="max-w-4xl mx-auto px-6 py-8">
          {auth.status === 'checking' && <Notice t={t}>Checking your session…</Notice>}
          {auth.status === 'anonymous' && <LoginForm t={t} onLogin={auth.login} />}
          {auth.status === 'authenticated' && <Dashboard t={t} user={auth.user} />}
        </main>
      </div>
    </div>
  )
}

export default App
