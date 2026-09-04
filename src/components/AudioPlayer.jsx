import { useState } from 'react'

// Reproductor de audio SIMULADO (no funcional). Solo estado visual.
export default function AudioPlayer({ duracion = '5:00', titulo = 'Grabación original' }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying((v) => !v)}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-terracota text-cream shadow-soft transition hover:bg-terracota-dark"
          aria-label={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{titulo}</p>

          {/* Onda de audio simulada */}
          <div className="mt-2 flex h-8 items-center gap-[3px]">
            {Array.from({ length: 48 }).map((_, i) => {
              const height = 20 + Math.abs(Math.sin(i * 0.9) * 60) + (i % 5) * 4
              const active = playing && i < 18
              return (
                <span
                  key={i}
                  className={`w-[3px] rounded-full transition-colors ${
                    active ? 'bg-terracota' : 'bg-arenaDark/70'
                  }`}
                  style={{ height: `${Math.min(height, 100)}%` }}
                />
              )
            })}
          </div>

          <div className="mt-1.5 flex justify-between text-xs text-ink/50">
            <span>{playing ? '0:41' : '0:00'}</span>
            <span>{duracion}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink/45">
        Reproductor de demostración — audio no disponible en el prototipo
      </p>
    </div>
  )
}
