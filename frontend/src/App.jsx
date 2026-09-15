import Header from './components/Header'
import SearchBar from './components/SearchBar'
import Timeline from './components/Timeline'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <SearchBar />
        <Timeline />
      </main>
    </div>
  )
}

export default App