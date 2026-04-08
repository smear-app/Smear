import BottomNav from "./BottomNav"

interface AppPlaceholderPageProps {
  title?: string
  subtitle?: string
}

export default function AppPlaceholderPage({ title, subtitle }: AppPlaceholderPageProps) {
  return (
    <div className="app-safe-shell min-h-screen bg-stone-bg">
      <main className="app-safe-shell__main mx-auto min-h-screen max-w-[420px] pb-32 pt-6 flex items-center justify-center">
        {title && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
            <span className="text-4xl mb-4 block">🚧</span>
            <h1 className="text-lg font-semibold text-stone-100">{title}</h1>
            {subtitle && <p className="text-sm text-stone-400 mt-1">{subtitle}</p>}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
