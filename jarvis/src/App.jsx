import ChatStage from './components/ChatStage'
import IntelPanel from './components/IntelPanel'
import LeftRail from './components/LeftRail'
import TopBar from './components/TopBar'
import { messages, quickSuggestions, recentActivity, statusMeters } from './data/mockData'

function App() {
  const now = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="flex w-full h-screen bg-[#02040a] overflow-hidden text-[#edf3ff]">
      {/* 3D background element */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#bf00ff]/10 blur-[150px] mix-blend-screen rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00f3ff]/10 blur-[150px] mix-blend-screen rounded-full" />
        {/* Simple CSS Grid pattern for the FUI look */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_scale(2.5)] opacity-40 origin-top" />
      </div>

      <LeftRail />

      <main className="flex flex-col flex-1 relative z-10 w-full min-w-0">
        <TopBar now={now} />

        <div className="flex flex-1 p-6 gap-6 h-[calc(100vh-70px)]">
          <ChatStage messages={messages} />
          <IntelPanel
            quickSuggestions={quickSuggestions}
            recentActivity={recentActivity}
            statusMeters={statusMeters}
          />
        </div>
      </main>
    </div>
  )
}

export default App
