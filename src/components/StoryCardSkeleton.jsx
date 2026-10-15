// Tarjeta de carga mientras llegan los relatos desde la API.
export default function StoryCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-arena/60" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 animate-pulse rounded bg-arena/70" />
        <div className="h-5 w-4/5 animate-pulse rounded bg-arena/70" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-arena/70" />
        <div className="h-3 w-full animate-pulse rounded bg-arena/50" />
      </div>
    </div>
  )
}
