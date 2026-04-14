import ChatStage from './components/ChatStage'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import {
  messages,
  quickSuggestions,
  recentActivity,
  statusMeters,
} from './data/mockData'

function App() {
  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="app-shell">
      <LeftRail />

      <section className="workspace">
        <TopBar now={now} />

        <main className="layout-grid">
          <ChatStage messages={messages} />
          <IntelPanel
            quickSuggestions={quickSuggestions}
            recentActivity={recentActivity}
            statusMeters={statusMeters}
          />
        </main>
      </section>
    </div>
  )
}

export default App
