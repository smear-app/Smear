const WelcomeCard = () => {
  return (
    <section className="flex items-center justify-between rounded-[28px] bg-[#f2f2f2] px-5 py-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-500">Welcome Back</p>
        <p className="text-2xl font-bold text-gray-900">Brandon</p>
      </div>
      <img
        src="https://i.pravatar.cc/100"
        alt="Brandon avatar"
        className="h-12 w-12 rounded-full object-cover"
      />
    </section>
  )
}

export default WelcomeCard
