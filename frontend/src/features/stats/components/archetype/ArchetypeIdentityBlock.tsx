type ArchetypeIdentityBlockProps = {
  label: string
  description: string
}

export default function ArchetypeIdentityBlock({ label, description }: ArchetypeIdentityBlockProps) {
  return (
    <div className="text-center">
      <h2 className="text-[1.65rem] font-bold leading-tight text-stone-text">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-secondary">{description}</p>
    </div>
  )
}
