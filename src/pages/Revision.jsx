import { useState } from 'react'
import { Link } from 'react-router-dom'
import RelatoMedia from '../components/RelatoMedia.jsx'
import AiBadge from '../components/AiBadge.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { EN_PROCESO, useStore } from '../context/StoreContext.jsx'
import { tipoLabel, tipoIcon } from '../data/mockData.js'
import { etiquetaMedio, formatoBytes } from '../utils/formato.js'

const ETIQUETA_PROCESO = {
  pendiente: 'En cola para la IA',
  transcribiendo: 'Whisper está transcribiendo el audio',
  clasificando: 'El modelo de lenguaje está clasificando el relato',
}

// Qué produjo el análisis: transcripción y clasificación.
function fuenteIA(relato) {
  const r = relato.revisionIA
  const partes = []
  if (relato.idioma) partes.push(`Transcripción: Whisper · idioma ${relato.idioma}`)
  if (r?.fuente?.startsWith('ollama:')) partes.push(`Clasificación: ${r.fuente.slice(7)} (Ollama, local)`)
  else if (r) partes.push('Clasificación: solo reglas')
  return partes.join(' · ')
}

function PendingCard({ relato, onAprobar, onRechazar, onReprocesar }) {
  const [abierto, setAbierto] = useState(false)
  const [devolviendo, setDevolviendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const revision = relato.revisionIA
  const conf = Math.round((revision?.confianza ?? 0.9) * 100)
  const alerta = conf < 80
  const archivo = relato.archivo
  const procesando = EN_PROCESO.includes(relato.procesamiento)

  // mantener: la tarjeta sigue en la cola tras la acción (p. ej. al reintentar).
  const ejecutar = async (accion, { mantener = false } = {}) => {
    setOcupado(true)
    setError('')
    try {
      await accion()
      if (mantener) setOcupado(false)
    } catch (err) {
      setError(err.message)
      setOcupado(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr]">
        {/* Registro visual: original o ilustración propuesta */}
        <div className="relative self-start overflow-hidden rounded-xl">
          <RelatoMedia
            relato={relato}
            controls={archivo?.tipoMedio === 'video'}
            className="aspect-[4/3] w-full sm:aspect-square"
          />
          {relato.iaGenerada && <AiBadge className="absolute left-2 top-2 scale-90" />}
        </div>

        {/* Contenido */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">
              {tipoIcon(relato.tipo)} {tipoLabel(relato.tipo)}
            </span>
            <span className="chip">
              {relato.municipio}, {relato.departamento}
            </span>
          </div>

          <h3 className="mt-2 font-serif text-xl font-600 text-ink">{relato.titulo}</h3>
          <p className="text-sm text-selva">
            {relato.narrador} · {relato.comunidad}
          </p>

          {/* Archivo original almacenado */}
          {archivo && (
            <div className="mt-3 rounded-lg border border-arena bg-paper p-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate text-ink/75">
                  📎 <strong className="font-semibold">{archivo.nombre}</strong> ·{' '}
                  {etiquetaMedio[archivo.tipoMedio]} · {formatoBytes(archivo.tamano)}
                </span>
                <a
                  href={archivo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 font-semibold text-terracota hover:underline"
                >
                  Abrir
                </a>
              </div>
              {archivo.tipoMedio === 'audio' && (
                <audio src={archivo.url} controls preload="none" className="mt-2 h-9 w-full" />
              )}
            </div>
          )}

          {/* Pre-revisión de la IA */}
          {procesando ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-anil/25 bg-anil/5 p-3 text-xs text-anil">
              <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-anil/30 border-t-anil" />
              <span>
                <strong className="font-semibold">{ETIQUETA_PROCESO[relato.procesamiento]}</strong>
                {' — '}la aprobación se habilita cuando la IA termine.
              </span>
            </div>
          ) : relato.procesamiento === 'error' ? (
            <div className="mt-3 rounded-lg border border-terracota/40 bg-terracota/5 p-3 text-xs">
              <p className="font-semibold text-terracota">⚠ La IA no pudo procesar este relato</p>
              <p className="mt-1 text-ink/70">{relato.procesamientoError}</p>
              <button
                disabled={ocupado}
                onClick={() => ejecutar(() => onReprocesar(relato), { mantener: true })}
                className="mt-2 font-semibold text-terracota hover:underline disabled:opacity-60"
              >
                ↻ Reintentar procesamiento
              </button>
            </div>
          ) : (
            relato.revisionIA && (
              <div
                className={`mt-3 rounded-lg border p-3 ${
                  alerta ? 'border-ocre/40 bg-ocre/10' : 'border-anil/25 bg-anil/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${alerta ? 'text-terracota-dark' : 'text-anil'}`}>
                    🤖 Pre-revisión de la IA {alerta && '· requiere atención'}
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${alerta ? 'text-terracota-dark' : 'text-anil'}`}>
                    {conf}% confianza
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-anil/15">
                  <div
                    className={`h-full rounded-full ${alerta ? 'bg-ocre' : 'bg-anil'}`}
                    style={{ width: `${conf}%` }}
                  />
                </div>

                {revision.resumen && (
                  <p className="mt-2 text-xs italic text-ink/75">“{revision.resumen}”</p>
                )}

                <ul className="mt-2 space-y-0.5">
                  {revision.sugerencias.map((s) => (
                    <li key={s} className="text-[11px] text-ink/70">
                      • {s}
                    </li>
                  ))}
                </ul>

                {revision.alertas?.length > 0 && (
                  <ul className="mt-2 space-y-1 rounded-md bg-cream/70 p-2">
                    {revision.alertas.map((a) => (
                      <li key={a} className="text-[11px] text-terracota-dark">
                        ⚠ {a}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-2 text-[10px] uppercase tracking-wide text-ink/45">
                  {fuenteIA(relato)}
                </p>
              </div>
            )
          )}

          {relato.transcripcion.length > 0 && (
            <>
              <button
                onClick={() => setAbierto((v) => !v)}
                className="mt-3 text-sm font-medium text-terracota hover:underline"
              >
                {abierto ? 'Ocultar transcripción' : 'Ver transcripción propuesta'}
              </button>
              {abierto && (
                <div className="mt-2 space-y-2 border-l-2 border-terracota/40 pl-4 font-serif text-sm leading-relaxed text-ink/80">
                  {relato.transcripcion.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Acciones de moderación */}
          {devolviendo ? (
            <div className="mt-4 space-y-2">
              <textarea
                rows={2}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={500}
                placeholder="¿Qué debe corregir la comunidad? (opcional)"
                className="w-full rounded-lg border border-arenaDark/60 bg-cream px-3 py-2 text-sm text-ink placeholder-ink/40 focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={ocupado}
                  onClick={() => ejecutar(() => onRechazar(relato, motivo))}
                  className="btn !px-5 !py-2 bg-terracota text-cream hover:bg-terracota-dark disabled:opacity-60"
                >
                  Confirmar devolución
                </button>
                <button
                  disabled={ocupado}
                  onClick={() => setDevolviendo(false)}
                  className="btn-ghost !px-5 !py-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={ocupado || procesando}
                onClick={() => ejecutar(() => onAprobar(relato))}
                className="btn-selva !px-5 !py-2 disabled:opacity-60"
                title={procesando ? 'Disponible cuando la IA termine' : undefined}
              >
                {ocupado ? 'Guardando…' : '✓ Aprobar y publicar'}
              </button>
              <button
                disabled={ocupado}
                onClick={() => setDevolviendo(true)}
                className="btn-ghost !px-5 !py-2 hover:!border-terracota hover:!text-terracota"
              >
                ↩ Devolver a la comunidad
              </button>
            </div>
          )}

          {error && <p className="mt-2 text-sm font-medium text-terracota">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default function Revision() {
  const {
    pendientes,
    actividad,
    estadisticas,
    error,
    cargando,
    refrescar,
    aprobar,
    rechazar,
    reprocesar,
  } = useStore()
  const [aviso, setAviso] = useState(null)

  const onAprobar = async (relato) => {
    await aprobar(relato.id)
    setAviso({ tipo: 'aprobado', relato })
  }

  const onRechazar = async (relato, motivo) => {
    await rechazar(relato.id, motivo)
    setAviso({ tipo: 'devuelto', relato })
  }

  return (
    <div>
      {/* Encabezado */}
      <section className="border-b border-arena bg-selva text-cream">
        <div className="container-mv py-12 sm:py-16">
          <span className="chip !border-ocre/40 !bg-cream/10 !text-ocre">
            Rol: Revisor de la comunidad
          </span>
          <h1 className="mt-4 font-serif text-4xl font-600 sm:text-5xl">
            Panel de revisión comunitaria
          </h1>
          <p className="mt-3 max-w-2xl text-cream/80">
            El último paso del flujo: una persona de la comunidad revisa lo que la IA
            transcribió e ilustró, y decide qué se publica. La IA asiste; la comunidad
            decide.
          </p>

          <div className="mt-8 flex flex-wrap gap-8">
            {[
              [pendientes.length, 'en cola de revisión'],
              [estadisticas?.publicados ?? '—', 'publicados'],
              [estadisticas?.devueltos ?? '—', 'devueltos a la comunidad'],
            ].map(([valor, label]) => (
              <div key={label}>
                <div className="font-serif text-4xl font-700 text-ocre">{valor}</div>
                <div className="text-sm text-cream/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-mv py-10">
        {aviso && (
          <div
            role="status"
            className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
              aviso.tipo === 'aprobado' ? 'bg-selva/10 text-selva' : 'bg-ocre/15 text-terracota-dark'
            }`}
          >
            <span>
              {aviso.tipo === 'aprobado' ? '✓ Publicado en el catálogo: ' : '↩ Devuelto a la comunidad: '}
              <strong>{aviso.relato.titulo}</strong>
            </span>
            <div className="flex items-center gap-3">
              {aviso.tipo === 'aprobado' && (
                <Link to={`/relato/${aviso.relato.id}`} className="font-semibold underline">
                  Ver publicado
                </Link>
              )}
              <button onClick={() => setAviso(null)} aria-label="Cerrar aviso">
                ✕
              </button>
            </div>
          </div>
        )}

        <ErrorBanner error={error} onReintentar={refrescar} className="mb-6" />

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Cola */}
          <div>
            <h2 className="font-serif text-2xl font-600 text-ink">Pendientes por revisar</h2>

            {cargando ? (
              <div className="mt-5 space-y-5">
                {[0, 1].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-xl2 bg-arena/50" />
                ))}
              </div>
            ) : pendientes.length > 0 ? (
              <div className="mt-5 space-y-5">
                {pendientes.map((r) => (
                  <PendingCard
                    key={r.id}
                    relato={r}
                    onAprobar={onAprobar}
                    onReprocesar={(relato) => reprocesar(relato.id)}
                    onRechazar={onRechazar}
                  />
                ))}
              </div>
            ) : (
              !error && (
                <div className="card mt-5 grid place-items-center py-16 text-center">
                  <div className="text-4xl">✨</div>
                  <p className="mt-4 font-serif text-xl text-ink">No hay relatos pendientes</p>
                  <p className="mt-1 text-sm text-ink/60">
                    Todo está revisado. Puedes registrar uno nuevo.
                  </p>
                  <Link to="/subir" className="btn-primary mt-6">
                    Aportar un relato
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Bitácora */}
          <aside>
            <div className="card p-5 lg:sticky lg:top-24">
              <h3 className="font-serif text-lg font-600 text-ink">Bitácora de actividad</h3>
              <p className="text-xs text-ink/50">Guardada en la base de datos</p>
              {actividad.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {actividad.slice(0, 8).map((a) => (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracota" />
                      <div className="min-w-0">
                        <p className="break-words text-ink/80">{a.texto}</p>
                        <p className="text-xs text-ink/45">
                          {new Date(a.fecha).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-ink/55">
                  Aún no hay actividad. Aprueba o registra un relato para verla aquí.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
