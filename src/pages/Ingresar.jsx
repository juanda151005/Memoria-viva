import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const inputCls =
  'w-full rounded-lg border border-arenaDark/60 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20'

// Solo se regresa a rutas internas, para no abrir redirecciones a otros sitios.
const destinoSeguro = (volver) =>
  volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/revision'

export default function Ingresar() {
  const { usuario, hayCuentas, ingresar } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const destino = destinoSeguro(params.get('volver'))

  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to={destino} replace />

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await ingresar(correo, clave)
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.message)
      setClave('')
      setEnviando(false)
    }
  }

  return (
    <div className="container-mv grid place-items-center py-16 sm:py-24">
      <div className="w-full max-w-md">
        <div className="text-center">
          <span className="eyebrow">Revisión comunitaria</span>
          <h1 className="mt-3 font-serif text-4xl font-600 text-ink">Ingresar</h1>
          <p className="mt-3 text-sm text-ink/65">
            Solo las personas designadas por la comunidad pueden revisar y publicar relatos.
          </p>
        </div>

        {!hayCuentas && (
          <div className="mt-6 rounded-xl border border-ocre/40 bg-ocre/10 p-4 text-sm text-ink/80">
            <p className="font-semibold text-terracota-dark">Aún no hay cuentas creadas</p>
            <p className="mt-1">Crea la primera cuenta de administración desde la terminal:</p>
            <code className="mt-2 block break-all rounded bg-cream px-2 py-1.5 font-mono text-xs">
              npm run usuario:crear -- --nombre "Tu nombre" --correo tu@correo.com --rol admin
            </code>
          </div>
        )}

        <form onSubmit={enviar} className="card mt-6 space-y-5 p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Correo</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={inputCls}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={inputCls}
            />
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-terracota/40 bg-terracota/5 px-3 py-2 text-sm font-medium text-terracota"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary w-full disabled:opacity-60">
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/60">
          ¿Quieres aportar un relato? No necesitas cuenta:{' '}
          <Link to="/subir" className="font-semibold text-terracota hover:underline">
            súbelo aquí
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
