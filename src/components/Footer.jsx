import { Link } from 'react-router-dom'

const principios = [
  {
    titulo: 'Autoría reconocida',
    texto:
      'Cada relato conserva el nombre de quien lo narra y de la comunidad a la que pertenece.',
  },
  {
    titulo: 'Consentimiento comunitario',
    texto:
      'Nada se publica sin la revisión y aprobación explícita de la comunidad de origen.',
  },
  {
    titulo: 'Transparencia con la IA',
    texto:
      'Toda ilustración o texto asistido por IA se marca de forma visible como tal.',
  },
]

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-arena bg-selva text-cream">
      <div className="container-mv py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream/10">
                <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
                  <path
                    d="M9 22V10l7 6 7-6v12"
                    fill="none"
                    stroke="#D08C2E"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="16" cy="20" r="2.2" fill="#C96B45" />
                </svg>
              </span>
              <span className="font-serif text-xl font-600">Memoria Viva</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/75">
              Preservamos con inteligencia artificial lo que la comunidad decide
              recordar. Patrimonio cultural afro, indígena y local de Colombia.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-lg">Navegar</h4>
            <ul className="mt-4 space-y-2 text-sm text-cream/80">
              <li>
                <Link to="/" className="hover:text-ocre">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/catalogo" className="hover:text-ocre">
                  Explorar el catálogo
                </Link>
              </li>
              <li>
                <Link to="/subir" className="hover:text-ocre">
                  Aportar un relato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg">Principios éticos</h4>
            <ul className="mt-4 space-y-3 text-sm text-cream/80">
              {principios.map((p) => (
                <li key={p.titulo}>
                  <span className="font-semibold text-ocre">{p.titulo}.</span>{' '}
                  {p.texto}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-cream/15 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Memoria Viva · Prototipo académico ·
            EAFIT
          </p>
          <p>
            Contenido cultural propiedad de sus comunidades. Uso con
            consentimiento previo, libre e informado.
          </p>
        </div>
      </div>
    </footer>
  )
}
