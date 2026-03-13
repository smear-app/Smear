import { useState } from "react"
import HomePage from "./HomePage"
import LogClimbModal from "./components/LogClimbModal"

function App() {
  const [isLogClimbOpen, setIsLogClimbOpen] = useState(false)
  const [savedClimbs, setSavedClimbs] = useState([])

  const handleSaveClimb = (draftClimb) => {
    const climbWithTimestamp = {
      ...draftClimb,
      createdAt: new Date().toISOString(),
    }

    setSavedClimbs((currentClimbs) => [...currentClimbs, climbWithTimestamp])
    setIsLogClimbOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-slate-900">
      <HomePage
        onOpenLogClimb={() => setIsLogClimbOpen(true)}
        savedClimbs={savedClimbs}
      />
      <LogClimbModal
        isOpen={isLogClimbOpen}
        onClose={() => setIsLogClimbOpen(false)}
        onSave={handleSaveClimb}
      />
    </div>
  )
}

export default App
