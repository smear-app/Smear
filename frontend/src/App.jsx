import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { GymProvider, useGym } from "./context/GymContext"
import HomePage from "./HomePage"
import LogClimbModal from "./components/LogClimbModal"
import AuthPage from "./pages/AuthPage"
import FeedPage from "./pages/FeedPage"
import { deleteClimb, insertClimb, toClimbDraft, updateClimb } from "./lib/climbs"
import ClimbDetailPage from "./pages/ClimbDetailPage"
import LogbookPage from "./pages/LogbookPage"
import ProfilePage from "./pages/ProfilePage"
import SocialPage from "./pages/SocialPage"
import StatsPage from "./pages/StatsPage"

function ProtectedApp() {
  const { session, loading } = useAuth()
  const { activeGym } = useGym()
  const [isLogClimbOpen, setIsLogClimbOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingClimb, setEditingClimb] = useState(null)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-bg">
        <p className="text-sm text-stone-muted">Loading…</p>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  async function handleSaveClimb(draft) {
    if (editingClimb) {
      await updateClimb(draft, editingClimb.id, session.user.id)
      return
    }

    await insertClimb(draft, session.user.id)
  }

  function handleOpenLogClimb() {
    if (!activeGym) return
    setEditingClimb(null)
    setIsLogClimbOpen(true)
  }

  function handleEditClimb(climb) {
    setEditingClimb(climb)
    setIsLogClimbOpen(true)
  }

  async function handleDeleteLoggedClimb(climbId) {
    await deleteClimb(climbId, session.user.id)
    setRefreshKey((k) => k + 1)
  }

  function handleDone() {
    setIsLogClimbOpen(false)
    setEditingClimb(null)
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
              onEditClimb={handleEditClimb}
              onDeleteClimb={handleDeleteLoggedClimb}
              refreshKey={refreshKey}
            />
          }
        />
        <Route path="/climbs/:climbId" element={<ClimbDetailPage />} />
        <Route
          path="/home/logbook"
          element={
            <LogbookPage
              onEditClimb={handleEditClimb}
              onDeleteClimb={handleDeleteLoggedClimb}
              refreshKey={refreshKey}
            />
          }
        />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <LogClimbModal
        isOpen={isLogClimbOpen}
        onClose={() => {
          setIsLogClimbOpen(false)
          setEditingClimb(null)
        }}
        onSave={handleSaveClimb}
        onDone={handleDone}
        activeGym={editingClimb?.gym_id ? { id: editingClimb.gym_id, name: editingClimb.gym_name } : activeGym}
        initialDraft={editingClimb ? toClimbDraft(editingClimb) : null}
        mode={editingClimb ? "edit" : "create"}
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
