type ArchetypeIdentityBlockProps = {
  label: string
  description: string
}

export default function ArchetypeIdentityBlock({ label, description }: ArchetypeIdentityBlockProps) {
  return (
    <div className="text-center">
      <h2 className="text-[1.65rem] font-bold leading-tight text-stone-text">{label}</h2>
      <p className="mt-1.5 text-[13px] leading-5 text-stone-muted">{description}</p>
    </div>
  )
}
