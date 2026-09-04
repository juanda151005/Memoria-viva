// Badge de transparencia ética: marca visiblemente el contenido ilustrado por IA.

export default function AiBadge({ className = '', size = 'sm' }) {
  const pad = size === 'lg' ? 'px-3.5 py-2 text-xs' : 'px-2.5 py-1 text-[11px]'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-anil/90 font-semibold uppercase tracking-wide text-cream backdrop-blur ${pad} ${className}`}
      title="Esta imagen fue generada por inteligencia artificial"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l2.2 5.3L20 10l-5.8 1.7L12 17l-2.2-5.3L4 10l5.8-1.7L12 3z"
          fill="currentColor"
        />
      </svg>
      Ilustración generada por IA
    </span>
  )
}
