type ClimbDetailHeroProps = {
  imageUrl?: string | null
  height: number
}

export default function ClimbDetailHero({ imageUrl, height }: ClimbDetailHeroProps) {
  if (!imageUrl) {
    return (
      <header
        className="relative overflow-hidden rounded-b-[32px] border-b border-stone-border bg-[radial-gradient(circle_at_top,#f2ede7,transparent_58%),linear-gradient(180deg,#f8f4ef_0%,#efe8df_100%)]"
        style={{ height }}
      >
        <button
          type="button"
          className="absolute right-5 top-5 rounded-full border border-stone-border bg-stone-surface/90 px-3.5 py-2 text-xs font-semibold text-stone-secondary shadow-[0_10px_24px_rgba(89,68,51,0.08)] backdrop-blur transition-colors duration-200 hover:text-ember"
        >
          Add Image
        </button>

        <div className="flex h-full flex-col items-center justify-center px-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-muted">
            Reference Image
          </p>
          <p className="mt-3 text-sm font-medium text-stone-secondary">There is no reference image</p>
        </div>
      </header>
    )
  }

  return (
    <header
      className="relative overflow-hidden rounded-b-[36px] border-b border-stone-border bg-stone-alt"
      style={{ height }}
    >
      <img src={imageUrl} alt="Climb reference" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-stone-text/45 via-stone-text/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-stone-text/35 to-transparent" />
    </header>
  )
}
