// Aviso cuando la API no responde o devuelve un error.
export default function ErrorBanner({ error, onReintentar, className = '' }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracota/40 bg-terracota/5 px-4 py-3 text-sm text-terracota-dark ${className}`}
    >
      <span>
        <strong className="font-semibold">No pudimos cargar los datos.</strong>{' '}
        {error.message}
      </span>
      {onReintentar && (
        <button
          onClick={onReintentar}
          className="rounded-full border border-terracota/50 px-4 py-1.5 text-xs font-semibold hover:bg-terracota/10"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
