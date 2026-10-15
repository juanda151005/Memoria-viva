import { useEffect, useState } from 'react'
import StoryCard from '../components/StoryCard.jsx'
import StoryCardSkeleton from '../components/StoryCardSkeleton.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { api } from '../api/client.js'
import { useApi } from '../hooks/useApi.js'
import {
  departamentos,
  tiposPatrimonio,
  tematicas,
  epocas,
} from '../data/mockData.js'

const initialFilters = {
  q: '',
  departamento: '',
  tipo: '',
  tematica: '',
  epoca: '',
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/60">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-arenaDark/60 bg-cream px-3 py-2.5 text-sm text-ink focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20"
      >
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function Catalog() {
  const [filters, setFilters] = useState(initialFilters)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [intento, setIntento] = useState(0)

  const set = (key) => (val) => setFilters((f) => ({ ...f, [key]: val }))

  // La búsqueda de texto espera a que se deje de escribir antes de consultar.
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(filters.q.trim()), 250)
    return () => clearTimeout(t)
  }, [filters.q])

  // Filtros y búsqueda se resuelven en la base de datos (GET /api/relatos).
  const { data, loading, error } = useApi(
    () =>
      api.listarRelatos({
        q: busqueda,
        departamento: filters.departamento,
        tipo: filters.tipo,
        tematica: filters.tematica,
        epoca: filters.epoca,
      }),
    [busqueda, filters.departamento, filters.tipo, filters.tematica, filters.epoca, intento]
  )
  const resultados = data ?? []

  const activos = Object.entries(filters).filter(
    ([k, v]) => v && k !== 'q'
  ).length

  const FilterPanel = (
    <div className="space-y-5">
      <FilterSelect
        label="Departamento"
        value={filters.departamento}
        onChange={set('departamento')}
        options={departamentos}
      />
      <FilterSelect
        label="Tipo de patrimonio"
        value={filters.tipo}
        onChange={set('tipo')}
        options={tiposPatrimonio.map((t) => ({
          value: t.id,
          label: `${t.icon} ${t.label}`,
        }))}
      />
      <FilterSelect
        label="Temática"
        value={filters.tematica}
        onChange={set('tematica')}
        options={tematicas}
      />
      <FilterSelect
        label="Época"
        value={filters.epoca}
        onChange={set('epoca')}
        options={epocas}
      />

      {(activos > 0 || filters.q) && (
        <button
          onClick={() => setFilters(initialFilters)}
          className="w-full rounded-lg border border-arenaDark/60 py-2.5 text-sm font-medium text-terracota hover:bg-paper"
        >
          Limpiar filtros ({activos + (filters.q ? 1 : 0)})
        </button>
      )}
    </div>
  )

  return (
    <div>
      {/* Encabezado */}
      <section className="border-b border-arena bg-cream paper-grain">
        <div className="container-mv py-12 sm:py-16">
          <span className="eyebrow">Catálogo</span>
          <h1 className="mt-3 font-serif text-4xl font-600 text-ink sm:text-5xl">
            Explorar el patrimonio vivo
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Navega los relatos, cantos, oficios y saberes registrados por las
            comunidades. Filtra por región, tipo de patrimonio, temática o época.
          </p>

          {/* Búsqueda */}
          <div className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-arenaDark/60 bg-paper px-4 py-1 focus-within:border-terracota focus-within:ring-2 focus-within:ring-terracota/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ink/50">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              value={filters.q}
              onChange={(e) => set('q')(e.target.value)}
              placeholder="Buscar por relato, comunidad, municipio…"
              className="w-full bg-transparent py-2.5 text-sm text-ink placeholder-ink/45 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <div className="container-mv py-10">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filtros desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 card p-5">
              <h2 className="font-serif text-lg font-600 text-ink">Filtros</h2>
              <div className="mt-5">{FilterPanel}</div>
            </div>
          </aside>

          {/* Resultados */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-ink/70">
                <span className="font-serif text-xl font-700 text-ink">
                  {resultados.length}
                </span>{' '}
                {resultados.length === 1 ? 'relato' : 'relatos'}
                {loading && data && (
                  <span className="ml-2 text-xs text-ink/45">actualizando…</span>
                )}
              </p>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="btn-ghost !py-2 !px-4 lg:hidden"
              >
                Filtros {activos > 0 && `(${activos})`}
              </button>
            </div>

            {/* Filtros móvil */}
            {mobileOpen && (
              <div className="mb-6 card p-5 lg:hidden">{FilterPanel}</div>
            )}

            {error ? (
              <ErrorBanner error={error} onReintentar={() => setIntento((n) => n + 1)} />
            ) : loading && !data ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <StoryCardSkeleton key={i} />
                ))}
              </div>
            ) : resultados.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {resultados.map((r) => (
                  <StoryCard key={r.id} relato={r} />
                ))}
              </div>
            ) : (
              <div className="card grid place-items-center py-20 text-center">
                <div className="text-4xl">🔎</div>
                <p className="mt-4 font-serif text-xl text-ink">
                  No encontramos relatos con esos filtros
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  Prueba con otros criterios o limpia los filtros.
                </p>
                <button
                  onClick={() => setFilters(initialFilters)}
                  className="btn-primary mt-6"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
