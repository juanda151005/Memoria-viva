import { useParams, Link } from 'react-router-dom'
import GeneratedArt from '../components/GeneratedArt.jsx'
import AiBadge from '../components/AiBadge.jsx'
import AudioPlayer from '../components/AudioPlayer.jsx'
import StoryCard from '../components/StoryCard.jsx'
import { getRelato, relatos, tipoLabel, tipoIcon } from '../data/mockData.js'

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export default function StoryDetail() {
  const { id } = useParams()
  const relato = getRelato(id)

  if (!relato) {
    return (
      <div className="container-mv grid place-items-center py-32 text-center">
        <div className="text-5xl">🌵</div>
        <h1 className="mt-4 font-serif text-3xl text-ink">
          No encontramos ese relato
        </h1>
        <Link to="/catalogo" className="btn-primary mt-6">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const relacionados = relatos
    .filter((r) => r.id !== relato.id && r.region === relato.region)
    .slice(0, 3)

  const fechaLegible = new Date(relato.fechaRegistro).toLocaleDateString(
    'es-CO',
    { year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <div>
      {/* Breadcrumb */}
      <div className="container-mv pt-8">
        <nav className="flex items-center gap-2 text-sm text-ink/55">
          <Link to="/" className="hover:text-terracota">
            Inicio
          </Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-terracota">
            Catálogo
          </Link>
          <span>/</span>
          <span className="text-ink/80">{relato.titulo}</span>
        </nav>
      </div>

      <article className="container-mv py-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Columna principal */}
          <div>
            {/* Ilustración grande con badge IA */}
            <div className="relative overflow-hidden rounded-xl2 shadow-warm">
              <GeneratedArt
                seed={relato.id}
                palette={relato.palette}
                className="aspect-[16/10] w-full"
              />
              {relato.iaGenerada && (
                <AiBadge size="lg" className="absolute left-4 top-4 shadow-warm" />
              )}
            </div>
            <p className="mt-2 text-center text-xs italic text-ink/50">
              Imagen creada por IA a partir del relato, por ausencia de registro
              visual original. Revisada y aprobada por la comunidad.
            </p>

            {/* Título y datos */}
            <div className="mt-8">
              <span className="chip">
                {tipoIcon(relato.tipo)} {tipoLabel(relato.tipo)}
              </span>
              <h1 className="mt-3 font-serif text-4xl font-600 leading-tight text-ink sm:text-5xl">
                {relato.titulo}
              </h1>
              <p className="mt-3 text-lg text-selva">
                Narrado por{' '}
                <span className="font-semibold">{relato.narrador}</span> ·{' '}
                {relato.comunidad}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {relato.tematicas.map((t) => (
                  <span key={t} className="chip">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Transcripción */}
            <div className="mt-10">
              <h2 className="flex items-center gap-2 font-serif text-2xl font-600 text-ink">
                Transcripción del relato
                <span className="chip !text-xs">📝 asistida por IA</span>
              </h2>
              <div className="mt-4 space-y-4 border-l-2 border-terracota/40 pl-5 font-serif text-lg leading-relaxed text-ink/85">
                {relato.transcripcion.map((par, i) => (
                  <p key={i} className={i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:font-700 first-letter:leading-[0.8] first-letter:text-terracota' : ''}>
                    {par}
                  </p>
                ))}
              </div>
              <p className="mt-5 text-xs text-ink/50">
                Transcripción generada automáticamente y corregida por hablantes
                de la comunidad. Puede conservar giros propios de la oralidad.
              </p>
            </div>
          </div>

          {/* Columna lateral */}
          <aside className="space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Reproductor */}
              <AudioPlayer
                duracion={relato.duracion}
                titulo="Grabación original del relato"
              />

              {/* Metadatos técnicos */}
              <div className="card p-6">
                <h3 className="font-serif text-lg font-600 text-ink">
                  Ficha del registro
                </h3>
                <dl className="mt-4 grid grid-cols-2 gap-4">
                  <Meta label="Comunidad" value={relato.comunidad} />
                  <Meta label="Municipio" value={relato.municipio} />
                  <Meta label="Departamento" value={relato.departamento} />
                  <Meta label="Región" value={relato.region} />
                  <Meta label="Época" value={relato.epoca} />
                  <Meta label="Duración" value={relato.duracion} />
                  <Meta label="Fecha de registro" value={fechaLegible} />
                  <Meta
                    label="Código"
                    value={<span className="font-mono text-xs">MV-{relato.id.slice(0, 6).toUpperCase()}</span>}
                  />
                </dl>

                <div className="mt-5 border-t border-arena pt-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                    Estado de revisión
                  </dt>
                  {relato.estado === 'revisado' ? (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-selva/10 px-3 py-2.5 text-sm font-semibold text-selva">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-selva text-cream text-xs">
                        ✓
                      </span>
                      Revisado y aprobado por la comunidad
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-ocre/15 px-3 py-2.5 text-sm font-semibold text-ocre">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-ocre text-cream text-xs">
                        ⏳
                      </span>
                      En revisión por la comunidad
                    </div>
                  )}
                </div>
              </div>

              {/* Nota ética */}
              <div className="card border-anil/30 bg-anil/5 p-5">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-anil">
                  🛡️ Uso responsable
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink/70">
                  Este contenido pertenece a su comunidad de origen y se comparte
                  con su consentimiento. Cítalo reconociendo a la persona
                  narradora y a la comunidad.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* Relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-2xl font-600 text-ink">
              Otros relatos de la región {relato.region}
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relacionados.map((r) => (
                <StoryCard key={r.id} relato={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
