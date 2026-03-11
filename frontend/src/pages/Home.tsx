import BottomNav from "../components/BottomNav"
import FloatingActionButton from "../components/FloatingActionButton"
import WelcomeCard from "../components/WelcomeCard"

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto flex min-h-screen max-w-[420px] flex-col px-6 pb-28 pt-8">
        <WelcomeCard />
        <div className="mt-12 flex-1" />
      </main>
      <FloatingActionButton />
      <BottomNav />
    </div>
  )
}

export default Home
