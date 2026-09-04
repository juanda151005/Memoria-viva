// GeneratedArt — placeholder generativo (SVG) que simula la "ilustración
// generada por IA". Deriva un patrón determinista a partir del id del relato,
// usando la paleta cálida del proyecto. Evita fotos de estereotipo.

function hashString(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const PATTERNS = ['rombos', 'ondas', 'sol', 'grecas']

export default function GeneratedArt({
  seed = 'memoria',
  palette = ['#2F4A3C', '#D08C2E'],
  className = '',
  variant, // opcional: forzar patrón
}) {
  const h = hashString(seed)
  const [c1, c2] = palette
  const kind = variant ?? PATTERNS[h % PATTERNS.length]
  const gid = `g-${h}`
  const rot = (h % 40) - 20

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Ilustración generada por inteligencia artificial"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill={`url(#${gid})`} />

      {/* Formas orgánicas de fondo */}
      <g opacity="0.16" fill="#FBF7F0">
        <circle cx={60 + (h % 80)} cy={70} r={90} />
        <circle cx={340 - (h % 60)} cy={250} r={70} />
      </g>

      {/* Motivo geométrico principal */}
      <g
        opacity="0.9"
        transform={`rotate(${rot} 200 150)`}
        stroke="#FBF7F0"
        strokeWidth="3"
        fill="none"
      >
        {kind === 'rombos' &&
          Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x={200 - (i + 1) * 22}
              y={150 - (i + 1) * 22}
              width={(i + 1) * 44}
              height={(i + 1) * 44}
              transform={`rotate(45 200 150)`}
              opacity={0.85 - i * 0.12}
            />
          ))}

        {kind === 'ondas' &&
          Array.from({ length: 7 }).map((_, i) => (
            <path
              key={i}
              d={`M -20 ${60 + i * 34} Q 100 ${30 + i * 34} 200 ${
                60 + i * 34
              } T 420 ${60 + i * 34}`}
              opacity={0.85 - i * 0.08}
            />
          ))}

        {kind === 'sol' && (
          <>
            <circle cx="200" cy="150" r="46" />
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2
              return (
                <line
                  key={i}
                  x1={200 + Math.cos(a) * 62}
                  y1={150 + Math.sin(a) * 62}
                  x2={200 + Math.cos(a) * 96}
                  y2={150 + Math.sin(a) * 96}
                />
              )
            })}
          </>
        )}

        {kind === 'grecas' &&
          Array.from({ length: 5 }).map((_, i) => (
            <path
              key={i}
              d={`M ${20 + i * 80} 250 v-40 h40 v-40 h40 v-40`}
              opacity={0.9 - i * 0.1}
            />
          ))}
      </g>

      {/* Puntos textiles */}
      <g fill="#FBF7F0" opacity="0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <circle
            key={i}
            cx={30 + ((i * 47 + h) % 360)}
            cy={20 + ((i * 71 + h) % 260)}
            r="2.5"
          />
        ))}
      </g>
    </svg>
  )
}
