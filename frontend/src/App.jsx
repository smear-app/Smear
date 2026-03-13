import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import HomePage from "./HomePage"
import LogClimbModal from "./components/LogClimbModal"
import AuthPage from "./pages/AuthPage"
import { insertClimb } from "./lib/climbs"
import ProfilePage from "./pages/ProfilePage"

function ProtectedApp() {
  const { session, loading } = useAuth()
  const [isLogClimbOpen, setIsLogClimbOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
        <p className="text-sm text-slate-400">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  async function handleSaveClimb(draft) {
    await insertClimb(draft, session.user.id)
  }

  function handleDone() {
    setIsLogClimbOpen(false)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-slate-900">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenLogClimb={() => setIsLogClimbOpen(true)}
              refreshKey={refreshKey}
            />
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <LogClimbModal
        isOpen={isLogClimbOpen}
        onClose={() => setIsLogClimbOpen(false)}
        onSave={handleSaveClimb}
        onDone={handleDone}
      />
    </div>
  )
}

function AuthRoute() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
