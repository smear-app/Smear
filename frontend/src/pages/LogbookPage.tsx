import { useLocation } from "react-router-dom"
import BackButton from "../components/BackButton"
import BottomNav from "../components/BottomNav"

export default function LogbookPage() {
  const location = useLocation()
  const isOpeningFromHome = location.state?.stackTransition === "forward"

  return (
    <div className="min-h-screen bg-stone-bg">
      <main
        className="mx-auto flex min-h-screen max-w-[420px] flex-col px-5 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-6"
        style={{
          animation: isOpeningFromHome ? "logbook-stack-enter 280ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
        }}
      >
        <style>{`
          @keyframes logbook-stack-enter {
            0% {
              opacity: 0.92;
              transform: translateX(18px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        <div className="flex items-center gap-3">
          <BackButton
            to="/home"
            state={{ stackTransition: "back" }}
            label="Back to Home"
            ariaLabel="Back to Home"
            size="sm"
          />

          <h1 className="text-base font-semibold text-stone-text">Logbook</h1>
        </div>

        <div className="mt-5 flex-1 rounded-[28px] border border-dashed border-stone-border bg-stone-surface/70 px-5 py-6 shadow-[0_14px_34px_rgba(89,68,51,0.05)]" />
      </main>

      <BottomNav />
    </div>
  )
}
