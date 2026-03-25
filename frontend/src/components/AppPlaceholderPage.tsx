import BottomNav from "./BottomNav"

export default function AppPlaceholderPage() {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto min-h-screen max-w-[420px] pb-32 pt-6" />

      <BottomNav />
    </div>
  )
}
