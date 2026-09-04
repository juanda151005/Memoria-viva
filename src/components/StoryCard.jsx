import { Link } from 'react-router-dom'
import GeneratedArt from './GeneratedArt.jsx'
import AiBadge from './AiBadge.jsx'
import { tipoIcon, tipoLabel } from '../data/mockData.js'

export default function StoryCard({ relato }) {
  return (
    <Link
      to={`/relato/${relato.id}`}
      className="card group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-warm"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <GeneratedArt
          seed={relato.id}
          palette={relato.palette}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {relato.iaGenerada && (
          <AiBadge className="absolute left-3 top-3 shadow-soft" />
        )}
        <span className="absolute right-3 top-3 chip !bg-paper/90 !text-ink">
          {tipoIcon(relato.tipo)} {tipoLabel(relato.tipo)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-ink/55">
          <span>{relato.municipio}</span>
          <span className="h-1 w-1 rounded-full bg-arenaDark" />
          <span>{relato.departamento}</span>
        </div>

        <h3 className="mt-1.5 font-serif text-lg font-600 leading-snug text-ink group-hover:text-terracota">
          {relato.titulo}
        </h3>

        <p className="mt-1 text-sm font-medium text-selva">
          {relato.comunidad}
        </p>

        <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/70">
          {relato.fragmento}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {relato.tematicas.slice(0, 2).map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          {relato.estado === 'revisado' ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-selva">
              ✓ Revisado
            </span>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-ocre">
              ⏳ En revisión
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
