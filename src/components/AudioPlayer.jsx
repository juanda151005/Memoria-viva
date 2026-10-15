import { useRef, useState } from 'react'
import { formatoDuracion } from '../utils/formato.js'

const BARRAS = 48

// Reproductor con onda visual. Con `src` reproduce el archivo real almacenado
// en el servidor; sin `src` (relatos de ejemplo) funciona en modo demostración.
export default function AudioPlayer({ src, duracion = '—', titulo = 'Grabación original' }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [tiempo, setTiempo] = useState(0)
  const [total, setTotal] = useState(0)
  const real = Boolean(src)

  const toggle = () => {
    if (!real) return setPlaying((v) => !v)
    const el = audioRef.current
    if (el.paused) el.play()
    else el.pause()
  }

  const buscar = (e) => {
    if (!real || !total) return
    const { left, width } = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - left) / width) * total
  }

  const avance = real ? (total ? tiempo / total : 0) : playing ? 0.37 : 0

  return (
    <div className="card p-4">
      {real && (
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTiempo(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setTotal(e.currentTarget.duration)}
        />
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
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

          {/* Onda de audio: muestra el avance y permite adelantar */}
          <div
            onClick={buscar}
            className={`mt-2 flex h-8 items-center gap-[3px] ${real ? 'cursor-pointer' : ''}`}
          >
            {Array.from({ length: BARRAS }).map((_, i) => {
              const height = 20 + Math.abs(Math.sin(i * 0.9) * 60) + (i % 5) * 4
              return (
                <span
                  key={i}
                  className={`w-[3px] rounded-full transition-colors ${
                    i / BARRAS < avance ? 'bg-terracota' : 'bg-arenaDark/70'
                  }`}
                  style={{ height: `${Math.min(height, 100)}%` }}
                />
              )
            })}
          </div>

          <div className="mt-1.5 flex justify-between text-xs text-ink/50">
            <span>{real ? formatoDuracion(tiempo) : playing ? '0:41' : '0:00'}</span>
            <span>{real ? (total ? formatoDuracion(total) : '—') : duracion}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-ink/45">
        {real
          ? 'Archivo original almacenado en el servidor'
          : 'Relato de ejemplo — no tiene audio cargado'}
      </p>
    </div>
  )
}
