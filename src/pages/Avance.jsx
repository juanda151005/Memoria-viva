import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useApi } from '../hooks/useApi.js'
import { useStore } from '../context/StoreContext.jsx'
import { formatoBytes } from '../utils/formato.js'

// Avance ponderado frente a la visión completa del producto.
// peso = esfuerzo relativo del componente; logrado = puntos ya cumplidos.
const componentes = [
  { nombre: 'Concepto, flujo y principios éticos', peso: 10, logrado: 10, nota: 'Completo' },
  { nombre: 'Diseño, UX e interfaz (6 vistas)', peso: 20, logrado: 20, nota: 'Completo' },
  { nombre: 'Flujo funcional de punta a punta', peso: 8, logrado: 8, nota: 'Completo' },
  { nombre: 'Backend, base de datos y almacenamiento', peso: 15, logrado: 15, nota: 'Completo en esta entrega' },
  { nombre: 'Transcripción real (Whisper)', peso: 12, logrado: 0, nota: 'Punto de integración listo' },
  { nombre: 'Clasificación automática (NLP)', peso: 10, logrado: 0, nota: 'Punto de integración listo' },
  { nombre: 'Ilustraciones texto-a-imagen', peso: 8, logrado: 0, nota: 'Punto de integración listo' },
  { nombre: 'Autenticación por roles y moderación', peso: 7, logrado: 3, nota: 'Moderación persistida; falta autenticación' },
  { nombre: 'Despliegue, seguridad, pruebas y piloto', peso: 10, logrado: 2, nota: '12 pruebas automatizadas y validación' },
]

const progreso = componentes.reduce((total, c) => total + c.logrado, 0)

const fases = [
  {
    nombre: 'Fase 1 — Investigación y concepto',
    estado: 'completado',
    items: [
      'Definición del problema y comunidades objetivo',
      'Flujo: subir → transcribir → catalogar → revisar → publicar',
      'Principios éticos (autoría, consentimiento, transparencia IA)',
    ],
  },
  {
    nombre: 'Fase 2 — Prototipo de interfaz',
    estado: 'completado',
    items: [
      'Sistema de diseño con identidad cultural',
      '6 vistas navegables y responsive',
      'Flujo funcional con moderación humana',
      'Simulación del pipeline de IA',
    ],
  },
  {
    nombre: 'Fase 3 — Backend, base de datos y almacenamiento (entrega actual)',
    estado: 'completado',
    items: [
      'API REST con Express (10 endpoints)',
      'Base de datos SQLite con esquema relacional',
      'Almacenamiento de archivos con hash SHA-256',
      'Validación de datos y consentimiento en el servidor',
      'Bitácora de actividad auditable',
      '12 pruebas automatizadas de integración',
    ],
  },
  {
    nombre: 'Fase 4 — Integración de IA real',
    estado: 'siguiente',
    items: [
      'Transcripción con Whisper (ASR)',
      'Clasificación por región, tipo y temática (NLP)',
      'Generación de ilustraciones (texto-a-imagen)',
      'Detección de saberes restringidos y datos personales',
    ],
  },
  {
    nombre: 'Fase 5 — Cuentas, despliegue y piloto',
    estado: 'pendiente',
    items: [
      'Autenticación por roles (comunidad, revisor, público)',
      'Migración a PostgreSQL y almacenamiento en la nube',
      'Despliegue público',
      'Piloto con una comunidad real',
    ],
  },
]

const arquitectura = [
  { icon: '🎙️', titulo: 'Captura', tec: 'Web / móvil', desc: 'La comunidad sube audio, video, foto o documento.' },
  { icon: '☁️', titulo: 'Almacenamiento', tec: 'Multer + SHA-256', desc: 'El archivo original se guarda con un nombre seguro y su huella digital.' },
  { icon: '📝', titulo: 'Transcripción (ASR)', tec: 'Whisper', desc: 'El audio se convierte a texto con segmentación por tiempo.' },
  { icon: '🗂️', titulo: 'Clasificación (NLP)', tec: 'LLM + reglas', desc: 'Se infieren región, tipo y temáticas, y se marcan contenidos sensibles.' },
  { icon: '🎨', titulo: 'Ilustración', tec: 'Texto-a-imagen', desc: 'Solo si no hay foto o video original; siempre marcada como IA.' },
  { icon: '✅', titulo: 'Moderación humana', tec: 'Human-in-the-loop', desc: 'La comunidad aprueba o devuelve con motivo antes de publicar.' },
]

const endpoints = [
  ['GET', '/api/relatos', 'Catálogo público con filtros y búsqueda'],
  ['GET', '/api/relatos/:id', 'Detalle de un relato publicado'],
  ['POST', '/api/relatos', 'Registro de relato + archivo y pipeline de IA'],
  ['GET', '/api/revision', 'Cola de revisión comunitaria'],
  ['POST', '/api/relatos/:id/aprobar', 'Aprobar y publicar'],
  ['POST', '/api/relatos/:id/rechazar', 'Devolver a la comunidad con motivo'],
  ['GET', '/api/archivos/:id', 'Archivo original (con streaming)'],
  ['GET', '/api/estadisticas', 'Métricas del sistema'],
  ['GET', '/api/actividad', 'Bitácora de actividad'],
  ['GET', '/api/salud', 'Estado del servicio'],
]

const tablas = [
  {
    nombre: 'relatos',
    desc: 'Metadatos, transcripción, clasificación y estado de revisión',
    campos: ['id', 'titulo', 'comunidad', 'narrador', 'tipo', 'tematicas (JSON)', 'transcripcion (JSON)', 'revision_ia (JSON)', 'estado', 'publicado', 'archivo_id → archivos'],
  },
  {
    nombre: 'archivos',
    desc: 'Medios originales guardados en disco',
    campos: ['id', 'nombre_original', 'nombre_almacenado', 'mime', 'tipo_medio', 'tamano', 'sha256'],
  },
  {
    nombre: 'actividad',
    desc: 'Bitácora auditable del flujo de revisión',
    campos: ['id', 'texto', 'relato_id', 'fecha'],
  },
]

const changelog = [
  'API REST con Express: catálogo, registro, revisión, archivos y métricas.',
  'Base de datos SQLite: los relatos, archivos y la bitácora ya persisten.',
  'Subida real de archivos con barra de progreso y huella SHA-256.',
  'Reproducción del audio, foto o video original desde el servidor.',
  'Devolución de relatos con motivo y bitácora guardada en la BD.',
  'Pipeline de IA trasladado al servidor, listo para conectar modelos reales.',
  '12 pruebas automatizadas de la API (npm test).',
]

const estadoStyle = {
  completado: { chip: 'bg-selva text-cream', label: '✓ Completado', dot: 'bg-selva' },
  siguiente: { chip: 'bg-ocre text-cream', label: '→ Siguiente', dot: 'bg-ocre' },
  pendiente: { chip: 'bg-arena text-ink/70', label: '○ Pendiente', dot: 'bg-arenaDark' },
}

function Metric({ valor, label }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-serif text-4xl font-700 text-terracota">{valor}</div>
      <div className="mt-1 text-sm text-ink/65">{label}</div>
    </div>
  )
}

const colorMetodo = { GET: 'bg-selva/10 text-selva', POST: 'bg-terracota/10 text-terracota' }

export default function Avance() {
  const { estadisticas, reiniciarDemo } = useStore()
  const [intento, setIntento] = useState(0)
  const salud = useApi(() => api.salud(), [intento])
  const [reiniciando, setReiniciando] = useState(false)

  const enLinea = salud.data?.ok

  const reiniciar = async () => {
    if (!window.confirm('¿Reiniciar los datos de demostración? Se borrarán los relatos y archivos subidos.')) return
    setReiniciando(true)
    try {
      await reiniciarDemo()
      setIntento((n) => n + 1)
    } catch (err) {
      window.alert(err.message)
    } finally {
      setReiniciando(false)
    }
  }

  return (
    <div>
      {/* Encabezado */}
      <section className="border-b border-arena bg-cream paper-grain">
        <div className="container-mv py-12 sm:py-16">
          <span className="eyebrow">Estado del proyecto</span>
          <h1 className="mt-3 font-serif text-4xl font-600 text-ink sm:text-5xl">
            Avance del proyecto
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Evidencia del estado de desarrollo de Memoria Viva: avance ponderado, estado del
            sistema, arquitectura técnica, roadmap y novedades de esta entrega.
          </p>

          <div className="mt-8 max-w-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Avance del producto completo</span>
              <span className="font-serif text-xl font-700 text-terracota">{progreso}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-arena">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ocre to-terracota"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-ink/55">
              Fase actual: <strong>Backend, base de datos y almacenamiento</strong> — completada
              en esta entrega. Siguiente: integración de IA real.
            </p>
          </div>
        </div>
      </section>

      <div className="container-mv space-y-16 py-14">
        {/* Estado del sistema en vivo */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl font-600 text-ink">Estado del sistema</h2>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                salud.loading
                  ? 'bg-arena text-ink/60'
                  : enLinea
                  ? 'bg-selva/10 text-selva'
                  : 'bg-terracota/10 text-terracota'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  salud.loading ? 'bg-arenaDark' : enLinea ? 'animate-pulse bg-selva' : 'bg-terracota'
                }`}
              />
              {salud.loading
                ? 'Consultando API…'
                : enLinea
                ? `API en línea · ${salud.data.baseDeDatos} · v${salud.data.version}`
                : 'API sin conexión'}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric valor={estadisticas?.publicados ?? '—'} label="relatos publicados" />
            <Metric valor={estadisticas?.pendientes ?? '—'} label="en cola de revisión" />
            <Metric valor={estadisticas?.archivos ?? '—'} label="archivos almacenados" />
            <Metric
              valor={estadisticas ? formatoBytes(estadisticas.bytes) : '—'}
              label="almacenamiento usado"
            />
          </div>
          <p className="mt-3 text-xs text-ink/50">
            Cifras consultadas en vivo a la base de datos (GET /api/estadisticas).
          </p>
        </section>

        {/* Desglose del avance */}
        <section>
          <h2 className="font-serif text-2xl font-600 text-ink">¿De dónde sale el {progreso}%?</h2>
          <p className="mt-2 max-w-2xl text-ink/70">
            Cada componente pesa según el esfuerzo que representa dentro del producto
            completo. Lo ya construido es la base; lo más costoso que falta es la IA real.
          </p>
          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-arena text-left text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-5 py-3 font-semibold">Componente</th>
                  <th className="px-5 py-3 font-semibold">Avance</th>
                  <th className="px-5 py-3 text-right font-semibold">Aporte</th>
                </tr>
              </thead>
              <tbody>
                {componentes.map((c) => {
                  const pct = Math.round((c.logrado / c.peso) * 100)
                  return (
                    <tr key={c.nombre} className="border-b border-arena/60 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-ink">{c.nombre}</p>
                        <p className="text-xs text-ink/50">{c.nota}</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-arena">
                            <div
                              className={`h-full rounded-full ${pct === 100 ? 'bg-selva' : 'bg-ocre'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-ink/60">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-ink/70">
                        {c.logrado} / {c.peso}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-paper">
                  <td className="px-5 py-3 font-semibold text-ink" colSpan={2}>
                    Total
                  </td>
                  <td className="px-5 py-3 text-right font-serif text-lg font-700 text-terracota">
                    {progreso}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Arquitectura */}
        <section>
          <h2 className="font-serif text-2xl font-600 text-ink">Arquitectura del sistema</h2>

          {/* Capas */}
          <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              ['🖥️', 'Frontend', 'React + Vite + Tailwind', '6 vistas, cliente HTTP con progreso de subida'],
              ['⚙️', 'API REST', 'Node.js + Express', 'Validación, pipeline de IA y moderación'],
              ['🗄️', 'Datos', 'SQLite + disco', 'Relatos, archivos originales y bitácora'],
            ].map(([icon, titulo, tec, desc], i) => (
              <div key={titulo} className="contents">
                <div className="card p-5">
                  <div className="text-2xl">{icon}</div>
                  <h3 className="mt-2 font-serif text-lg font-600 text-ink">{titulo}</h3>
                  <span className="mt-1 inline-block rounded-full bg-anil/10 px-2 py-0.5 text-xs font-semibold text-anil">
                    {tec}
                  </span>
                  <p className="mt-2 text-sm text-ink/70">{desc}</p>
                </div>
                {i < 2 && (
                  <div className="grid place-items-center text-2xl text-arenaDark">
                    <span className="hidden md:inline">→</span>
                    <span className="md:hidden">↓</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <h3 className="mt-10 font-serif text-xl font-600 text-ink">Pipeline de un relato</h3>
          <p className="mt-1 max-w-2xl text-sm text-ink/70">
            Captura y almacenamiento ya son reales. Transcripción, clasificación e ilustración
            corren simuladas en el servidor (server/services/ia.js) con su firma definitiva,
            listas para conectar los modelos.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {arquitectura.map((a, i) => (
              <div key={a.titulo} className="card relative p-5">
                <span className="absolute right-4 top-4 font-serif text-2xl font-700 text-arena">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-selva/10 text-2xl">
                  {a.icon}
                </div>
                <h4 className="mt-3 font-serif text-lg font-600 text-ink">{a.titulo}</h4>
                <span className="mt-1 inline-block rounded-full bg-anil/10 px-2 py-0.5 text-xs font-semibold text-anil">
                  {a.tec}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* API y modelo de datos */}
        <section className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="font-serif text-2xl font-600 text-ink">API REST</h2>
            <div className="card mt-5 divide-y divide-arena/70">
              {endpoints.map(([metodo, ruta, desc]) => (
                <div key={metodo + ruta} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  <span
                    className={`w-12 rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold ${colorMetodo[metodo]}`}
                  >
                    {metodo}
                  </span>
                  <code className="font-mono text-xs text-ink">{ruta}</code>
                  <span className="w-full text-xs text-ink/55 sm:ml-auto sm:w-auto">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-600 text-ink">Modelo de datos</h2>
            <div className="mt-5 space-y-4">
              {tablas.map((t) => (
                <div key={t.nombre} className="card p-4">
                  <p className="font-mono text-sm font-semibold text-selva">{t.nombre}</p>
                  <p className="text-xs text-ink/55">{t.desc}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.campos.map((c) => (
                      <span key={c} className="rounded bg-paper px-1.5 py-0.5 font-mono text-[11px] text-ink/70">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section>
          <h2 className="font-serif text-2xl font-600 text-ink">Roadmap e hitos</h2>
          <div className="mt-6 space-y-5">
            {fases.map((f) => {
              const st = estadoStyle[f.estado]
              return (
                <div key={f.nombre} className="card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-serif text-xl font-600 text-ink">{f.nombre}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.chip}`}>
                      {st.label}
                    </span>
                  </div>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {f.items.map((it) => (
                      <li key={it} className="flex items-start gap-2 text-sm text-ink/75">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* Changelog y stack */}
        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-600 text-ink">Novedades de esta entrega</h2>
            <ul className="mt-5 space-y-3">
              {changelog.map((c) => (
                <li key={c} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-selva text-xs text-cream">
                    ✓
                  </span>
                  <span className="text-sm text-ink/80">{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card bg-selva p-6 text-cream">
            <h3 className="font-serif text-xl font-600">Stack técnico</h3>
            <ul className="mt-4 space-y-2 text-sm text-cream/85">
              <li>• React 18 + Vite + Tailwind — interfaz por componentes</li>
              <li>• Node.js + Express 5 — API REST</li>
              <li>• SQLite (node:sqlite) — base de datos relacional embebida</li>
              <li>• Multer — subida y almacenamiento de archivos</li>
              <li>• node:test — pruebas automatizadas de integración</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/subir" className="btn !px-5 !py-2 bg-cream text-selva hover:bg-paper">
                Probar el flujo
              </Link>
              <Link
                to="/revision"
                className="btn !px-5 !py-2 border border-cream/40 text-cream hover:bg-cream/10"
              >
                Panel de revisión
              </Link>
            </div>
            <button
              onClick={reiniciar}
              disabled={reiniciando}
              className="mt-5 text-xs text-cream/60 underline hover:text-cream disabled:opacity-50"
            >
              {reiniciando ? 'Reiniciando…' : 'Reiniciar datos de demostración'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
