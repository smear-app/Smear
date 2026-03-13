import { FiUser } from "react-icons/fi"

const WelcomeCard = () => {
  return (
    <section className="flex items-center justify-between rounded-[28px] bg-[#f2f2f2] px-5 py-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-500">Welcome Back</p>
        <p className="text-2xl font-bold text-gray-900">Brandon</p>
      </div>
      <div
        aria-label="Default user avatar"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm"
      >
        <FiUser className="h-6 w-6" />
      </div>
    </section>
  )
}

export default WelcomeCard
