import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { GymProvider, useGym } from "./context/GymContext"
import HomePage from "./HomePage"
import LogClimbModal from "./components/LogClimbModal"
import AuthPage from "./pages/AuthPage"
import { insertClimb } from "./lib/climbs"
import ClimbDetailPage from "./pages/ClimbDetailPage"
import LogbookPage from "./pages/LogbookPage"
import ProfilePage from "./pages/ProfilePage"

function ProtectedApp() {
  const { session, loading } = useAuth()
  const { activeGym } = useGym()
  const [isLogClimbOpen, setIsLogClimbOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-bg">
        <p className="text-sm text-stone-muted">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  async function handleSaveClimb(draft) {
    await insertClimb(draft, session.user.id)
  }

  function handleOpenLogClimb() {
    if (!activeGym) return
    setIsLogClimbOpen(true)
  }

  function handleDone() {
    setIsLogClimbOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-stone-bg text-stone-text">
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={
            <HomePage
              onOpenLogClimb={handleOpenLogClimb}
              refreshKey={refreshKey}
            />
          }
        />
        <Route path="/home/logbook" element={<LogbookPage />} />
        <Route path="/climbs/:climbId" element={<ClimbDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <LogClimbModal
        isOpen={isLogClimbOpen}
        onClose={() => setIsLogClimbOpen(false)}
        onSave={handleSaveClimb}
        onDone={handleDone}
        activeGym={activeGym}
      />
    </div>
  )
}

function AuthRoute() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/home" replace />
  return <AuthPage />
}

function GymScopedApp() {
  const { user } = useAuth()

  return (
    <GymProvider key={user?.id ?? "anon"} storageUserId={user?.id}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthRoute />} />
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </GymProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <GymScopedApp />
    </AuthProvider>
  )
}
