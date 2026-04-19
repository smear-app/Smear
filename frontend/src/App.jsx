import { useCallback, useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"
import { Capacitor } from "@capacitor/core"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { GymProvider, useGym } from "./context/GymContext"
import { LogClimbActionContext } from "./context/logClimbActionContext"
import HomePage from "./HomePage"
import EditClimbModal from "./components/EditClimbModal"
import LogClimbModal from "./components/LogClimbModal"
import AuthPage from "./pages/AuthPage"
import { deleteClimb, fetchPaginatedClimbs, insertClimb, toClimbDraft, updateClimb } from "./lib/climbs"
import ClimbDetailPage from "./pages/ClimbDetailPage"
import LogbookPage from "./pages/LogbookPage"
import ProfilePage from "./pages/ProfilePage"
import SocialPage from "./pages/SocialPage"
import StatsPage from "./pages/StatsPage"
import StatsDetailScrollReset from "./features/stats/components/StatsDetailScrollReset"
import ArchetypeStatsPage from "./features/stats/pages/ArchetypeStatsPage"
import PerformanceStatsPage from "./features/stats/pages/PerformanceStatsPage"
import ProgressionStatsPage from "./features/stats/pages/ProgressionStatsPage"
import SessionsStatsPage from "./features/stats/pages/SessionsStatsPage"
import AdminDuplicatesPage from "./pages/AdminDuplicatesPage"

function ProtectedApp() {
  const { session, loading, isAdmin } = useAuth()
  const { activeGym } = useGym()
  const [isLogClimbOpen, setIsLogClimbOpen] = useState(false)
  const [isEditClimbOpen, setIsEditClimbOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingClimb, setEditingClimb] = useState(null)
  const [recentClimbs, setRecentClimbs] = useState([])
  const [recentClimbsTotal, setRecentClimbsTotal] = useState(0)
  const [recentClimbsError, setRecentClimbsError] = useState(null)

  const loadRecentClimbs = useCallback(
    async ({ background = false } = {}) => {
      if (!session) {
        return
      }

      try {
        if (!background) {
          setRecentClimbsError(null)
        }

        const page = await fetchPaginatedClimbs({
          userId: session.user.id,
          limit: 5,
          offset: 0,
          sort: "newest",
        })

        setRecentClimbs(page.climbs)
        setRecentClimbsTotal(page.totalCount)
        setRecentClimbsError(null)
      } catch (error) {
        if (!background) {
          setRecentClimbsError(error instanceof Error ? error.message : "Failed to load climbs")
        }
      }
    },
    [session],
  )

  useEffect(() => {
    if (!session) {
      setRecentClimbs([])
      setRecentClimbsTotal(0)
      setRecentClimbsError(null)
      return
    }

    void loadRecentClimbs()
  }, [loadRecentClimbs, session])

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
      await updateClimb(draft, editingClimb)
      return {}
    }

    await insertClimb(draft, session.user.id)
    void loadRecentClimbs({ background: true })
    return {}
  }

  function handleOpenLogClimb() {
    if (!activeGym) return
    setEditingClimb(null)
    setIsLogClimbOpen(true)
  }

  function handleEditClimb(climb) {
    setEditingClimb(climb)
    setIsEditClimbOpen(true)
  }

  async function handleSaveEditedClimb(draft) {
    if (!editingClimb) {
      return
    }

    const updatedClimb = await updateClimb(draft, editingClimb)
    setRecentClimbs((currentClimbs) =>
      currentClimbs.map((climb) => (climb.id === updatedClimb.id ? updatedClimb : climb)),
    )
    setEditingClimb(updatedClimb)
    void loadRecentClimbs({ background: true })
  }

  async function handleDeleteLoggedClimb(climbId) {
    await deleteClimb(climbId, session.user.id)
    setRecentClimbs((currentClimbs) => currentClimbs.filter((climb) => climb.id !== climbId))
    setRecentClimbsTotal((currentTotal) => Math.max(0, currentTotal - 1))
  }

  function handleDone() {
    setIsLogClimbOpen(false)
    setIsEditClimbOpen(false)
    setEditingClimb(null)
    setRefreshKey((k) => k + 1)
  }

  const logClimbAction = {
    onOpen: handleOpenLogClimb,
    disabled: !activeGym,
  }

  return (
    <LogClimbActionContext.Provider value={logClimbAction}>
      <div className="min-h-screen bg-stone-bg text-stone-text">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route
            path="/home"
            element={
              <HomePage
                onEditClimb={handleEditClimb}
                onDeleteClimb={handleDeleteLoggedClimb}
                climbs={recentClimbs}
                totalClimbs={recentClimbsTotal}
                loadError={recentClimbsError}
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
          <Route
            path="/stats/progression"
            element={
              <>
                <StatsDetailScrollReset />
                <ProgressionStatsPage />
              </>
            }
          />
          <Route
            path="/stats/archetype"
            element={
              <>
                <StatsDetailScrollReset />
                <ArchetypeStatsPage />
              </>
            }
          />
          <Route
            path="/stats/performance"
            element={
              <>
                <StatsDetailScrollReset />
                <PerformanceStatsPage />
              </>
            }
          />
          <Route
            path="/stats/sessions"
            element={
              <>
                <StatsDetailScrollReset />
                <SessionsStatsPage />
              </>
            }
          />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/duplicates" element={isAdmin ? <AdminDuplicatesPage /> : <Navigate to="/home" replace />} />
        </Routes>
        <LogClimbModal
          isOpen={isLogClimbOpen}
          onClose={() => {
            setIsLogClimbOpen(false)
          }}
          onSave={handleSaveClimb}
          onDone={handleDone}
          activeGym={editingClimb?.gym_id ? { id: editingClimb.gym_id, name: editingClimb.gym_name } : activeGym}
          initialDraft={null}
          mode="create"
        />
        <EditClimbModal
          isOpen={isEditClimbOpen}
          onClose={() => {
            setIsEditClimbOpen(false)
            setEditingClimb(null)
          }}
          onSave={handleSaveEditedClimb}
          onDone={handleDone}
          initialDraft={editingClimb ? toClimbDraft(editingClimb) : null}
        />
      </div>
    </LogClimbActionContext.Provider>
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
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return
    }

    const platform = Capacitor.getPlatform()
    const isNativePlatform = Capacitor.isNativePlatform()

    if (platform === "ios" && isNativePlatform) {
      const viewportMeta = document.querySelector('meta[name="viewport"]')

      if (viewportMeta && !viewportMeta.content.includes("viewport-fit=cover")) {
        viewportMeta.content = `${viewportMeta.content}, viewport-fit=cover`
      }

      document.documentElement.dataset.platform = "capacitor-ios"

      return () => {
        delete document.documentElement.dataset.platform
      }
    }
  }, [])

  return (
    <AuthProvider>
      <GymScopedApp />
      <Analytics />
    </AuthProvider>
  )
}
