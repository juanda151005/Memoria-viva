import { Link } from 'react-router-dom'
import StoryCard from '../components/StoryCard.jsx'
import GeneratedArt from '../components/GeneratedArt.jsx'
import { relatos, estadisticas, pasos } from '../data/mockData.js'

function Hero() {
  return (
    <section className="relative overflow-hidden bg-selva text-cream">
      {/* Fondo generativo */}
      <div className="absolute inset-0 opacity-40">
        <GeneratedArt seed="hero-memoria-viva" palette={['#22382C', '#B5502E']} className="h-full w-full" variant="ondas" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-selva via-selva/70 to-selva/30" />

      <div className="container-mv relative py-24 sm:py-32">
        <div className="max-w-3xl animate-fadeUp">
          <span className="chip !border-ocre/40 !bg-cream/10 !text-ocre">
            Patrimonio cultural · Inteligencia artificial · Colombia
          </span>
          <h1 className="mt-6 font-serif text-5xl font-600 leading-[1.05] tracking-tight sm:text-7xl">
            Memoria Viva
          </h1>
          <p className="mt-6 max-w-2xl font-serif text-2xl font-400 italic leading-snug text-cream/90 sm:text-3xl">
            La memoria que se escucha, el patrimonio que permanece.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-cream/75">
            Una plataforma que usa IA para preservar, organizar y visibilizar los
            relatos ancestrales, saberes y obras de las comunidades afro,
            indígenas y locales de Colombia — antes de que se pierdan.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-primary">
              Explorar el catálogo
            </Link>
            <Link to="/subir" className="btn-ghost !border-cream/40 !text-cream hover:!bg-cream/10">
              Aportar un relato
            </Link>
          </div>
        </div>
      </div>

      {/* Onda decorativa inferior */}
      <svg
        className="relative block w-full text-paper"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0 40 Q 360 0 720 30 T 1440 30 V60 H0 Z"
        />
      </svg>
    </section>
  )
}

function Stats() {
  return (
    <section className="container-mv -mt-8 relative z-10">
      <div className="card grid grid-cols-2 gap-6 p-8 shadow-warm sm:grid-cols-4">
        {estadisticas.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-serif text-4xl font-700 text-terracota sm:text-5xl">
              {s.valor}
            </div>
            <div className="mt-1 text-sm text-ink/65">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

function Problema() {
  return (
    <section className="container-mv py-20 sm:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <span className="eyebrow">El problema</span>
          <h2 className="mt-3 font-serif text-3xl font-600 leading-tight text-ink sm:text-4xl">
            Cada mayor que se va sin ser escuchado se lleva una biblioteca
            entera.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ink/75">
            Miles de relatos ancestrales, oralituras, cantos, oficios y saberes
            tradicionales viven hoy solo en la memoria de las personas mayores.
            Están dispersos, sin registrar y en riesgo de desaparecer.
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/75">
            <strong className="text-selva">Memoria Viva</strong> pone la
            inteligencia artificial al servicio de las comunidades: escucha,
            transcribe y organiza ese patrimonio — pero siempre bajo su control y
            con su consentimiento.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              ['🎙️', 'Se escucha', 'Voces y cantos que no están en ningún libro'],
              ['🗂️', 'Se organiza', 'Un catálogo navegable y buscable'],
              ['🛡️', 'Se protege', 'Autoría y consentimiento comunitario'],
            ].map(([icon, t, d]) => (
              <div key={t}>
                <div className="text-2xl">{icon}</div>
                <div className="mt-1 text-sm font-semibold text-ink">{t}</div>
                <div className="text-xs text-ink/60">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl2 shadow-warm">
            <GeneratedArt
              seed="problema-patrimonio"
              palette={['#B5502E', '#D08C2E']}
              className="aspect-[4/5] w-full"
              variant="sol"
            />
          </div>
          <div className="card absolute -bottom-6 -left-6 max-w-[220px] p-4 shadow-warm">
            <p className="font-serif text-sm italic text-ink/80">
              "Lo que no se registra, con el tiempo se olvida."
            </p>
            <p className="mt-2 text-xs font-semibold text-terracota">
              — Sabedora, San Basilio de Palenque
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section className="bg-cream py-20 sm:py-28 paper-grain">
      <div className="container-mv">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Cómo funciona</span>
          <h2 className="mt-3 font-serif text-3xl font-600 text-ink sm:text-4xl">
            De la voz de la comunidad al catálogo, en cuatro pasos
          </h2>
          <p className="mt-4 text-ink/70">
            La IA hace el trabajo pesado; la comunidad siempre tiene la última
            palabra.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pasos.map((p, i) => (
            <div key={p.n} className="relative">
              <div className="card h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-selva/10 text-2xl">
                    {p.icon}
                  </span>
                  <span className="font-serif text-3xl font-700 text-arenaDark">
                    {p.n}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-600 text-ink">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">
                  {p.texto}
                </p>
              </div>
              {i < pasos.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-2xl text-arenaDark lg:block">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Destacados() {
  const destacados = relatos.slice(0, 4)
  return (
    <section className="container-mv py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Relatos destacados</span>
          <h2 className="mt-3 font-serif text-3xl font-600 text-ink sm:text-4xl">
            Voces que ya son memoria viva
          </h2>
        </div>
        <Link to="/catalogo" className="btn-ghost">
          Ver todo el catálogo →
        </Link>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {destacados.map((r) => (
          <StoryCard key={r.id} relato={r} />
        ))}
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="container-mv pb-8">
      <div className="relative overflow-hidden rounded-xl2 bg-terracota px-8 py-14 text-center text-cream shadow-warm sm:px-16">
        <div className="absolute inset-0 opacity-20">
          <GeneratedArt seed="cta-memoria" palette={['#8F3C20', '#D08C2E']} className="h-full w-full" variant="grecas" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-serif text-3xl font-600 sm:text-4xl">
            ¿Tu comunidad tiene un relato que contar?
          </h2>
          <p className="mt-4 text-cream/85">
            Sube un audio, una foto o un video. La IA lo transcribe y organiza; tu
            comunidad lo revisa y decide qué se publica.
          </p>
          <Link to="/subir" className="btn mt-8 bg-cream text-terracota hover:bg-paper">
            Aportar un relato
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Problema />
      <ComoFunciona />
      <Destacados />
      <CTA />
    </>
  )
}
