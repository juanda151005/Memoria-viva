import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useStore } from '../context/StoreContext.jsx'

// "visible" decide qué enlaces ve cada quien según su sesión.
const links = [
  { to: '/', label: 'Inicio', end: true, visible: () => true },
  { to: '/catalogo', label: 'Explorar', visible: () => true },
  { to: '/revision', label: 'Revisión', visible: (a) => a.puedeRevisar },
  { to: '/avance', label: 'Avance', visible: () => true },
  { to: '/cuentas', label: 'Cuentas', visible: (a) => a.esAdmin },
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

// Número de relatos esperando revisión comunitaria.
function Contador({ n }) {
  if (!n) return null
  return (
    <span
      className="ml-1.5 inline-grid h-5 min-w-5 place-items-center rounded-full bg-terracota px-1.5 text-[11px] font-semibold text-cream"
      aria-label={`${n} pendientes`}
    >
      {n}
    </span>
  )
}

function Sesion({ auth, onSalir, compacta = false }) {
  if (!auth.usuario) {
    return (
      <NavLink
        to="/ingresar"
        className={({ isActive }) =>
          `rounded-full px-4 py-2 text-sm font-medium ${
            isActive ? 'bg-cream text-terracota shadow-soft' : 'text-ink/70 hover:text-ink'
          }`
        }
      >
        Ingresar
      </NavLink>
    )
  }
  return (
    <div className={`flex items-center gap-2 ${compacta ? 'px-4 py-2' : ''}`}>
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-selva text-xs font-semibold text-cream"
        title={`${auth.usuario.nombre} · ${auth.usuario.rol}`}
      >
        {auth.usuario.nombre.charAt(0).toUpperCase()}
      </span>
      {compacta && (
        <span className="text-sm text-ink/80">
          {auth.usuario.nombre} <span className="text-ink/50">· {auth.usuario.rol}</span>
        </span>
      )}
      <button onClick={onSalir} className="text-sm font-medium text-ink/60 hover:text-terracota">
        Salir
      </button>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const auth = useAuth()
  const { pendientes } = useStore()
  const navigate = useNavigate()
  const visibles = links.filter((l) => l.visible(auth))

  const salir = async () => {
    setOpen(false)
    await auth.salir()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-arena/70 bg-paper/85 backdrop-blur-md">
      <nav className="container-mv flex h-16 items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-1 lg:flex">
          {visibles.map((l) => (
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
              {l.to === '/revision' && <Contador n={pendientes.length} />}
            </NavLink>
          ))}
          <div className="mx-2 h-6 w-px bg-arena" />
          <Sesion auth={auth} onSalir={salir} />
          <Link to="/subir" className="btn-primary ml-2 !py-2 !px-5">
            Aportar un relato
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-arenaDark/60 lg:hidden"
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
        <div className="border-t border-arena/70 bg-paper lg:hidden">
          <div className="container-mv flex flex-col gap-1 py-3">
            {visibles.map((l) => (
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
                {l.to === '/revision' && <Contador n={pendientes.length} />}
              </NavLink>
            ))}
            <div className="my-1 h-px bg-arena" />
            <div onClick={() => !auth.usuario && setOpen(false)}>
              <Sesion auth={auth} onSalir={salir} compacta />
            </div>
            <Link to="/subir" onClick={() => setOpen(false)} className="btn-primary mt-1">
              Aportar un relato
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
