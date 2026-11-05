import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Protege una página: sin sesión lleva a /ingresar (y luego regresa aquí);
// con una sesión sin el rol necesario muestra un aviso.
export default function RequiereRol({ roles, children }) {
  const { usuario, cargando } = useAuth()
  const { pathname } = useLocation()

  if (cargando) {
    return <div className="container-mv py-32 text-center text-sm text-ink/50">Verificando sesión…</div>
  }

  if (!usuario) {
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(pathname)}`} replace />
  }

  if (!roles.includes(usuario.rol)) {
    return (
      <div className="container-mv grid place-items-center py-32 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="mt-4 font-serif text-3xl text-ink">No tienes permiso para ver esta página</h1>
        <p className="mt-2 text-sm text-ink/60">
          Tu cuenta es de tipo <strong>{usuario.rol}</strong>.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return children
}
