import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/catalogo', label: 'Explorar' },
  { to: '/subir', label: 'Subir contenido' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-selva">
        <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M9 22V10l7 6 7-6v12"
            fill="none"
            stroke="#D08C2E"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="20" r="2.2" fill="#B5502E" />
        </svg>
      </span>
      <span className="font-serif text-xl font-600 leading-none tracking-tight text-ink">
        Memoria <span className="text-terracota">Viva</span>
      </span>
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-40 border-b border-arena/70 bg-paper/85 backdrop-blur-md">
      <nav className="container-mv flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cream text-terracota shadow-soft'
                    : 'text-ink/70 hover:text-ink'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/subir" className="btn-primary ml-2 !py-2 !px-5">
            Aportar un relato
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-arenaDark/60 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
          </div>
        </button>
      </nav>

      {open && (
        <div className="border-t border-arena/70 bg-paper md:hidden">
          <div className="container-mv flex flex-col gap-1 py-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-sm font-medium ${
                    isActive ? 'bg-cream text-terracota' : 'text-ink/80'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/subir"
              onClick={() => setOpen(false)}
              className="btn-primary mt-1"
            >
              Aportar un relato
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
