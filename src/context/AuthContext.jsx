import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

// ============================================================================
// AuthContext — sesión de la persona revisora o administradora.
// La sesión vive en una cookie HttpOnly que el navegador envía solo; aquí
// únicamente se guarda quién es el usuario para adaptar la interfaz.
// ============================================================================

const AuthContext = createContext(null)

export const ROLES_REVISION = ['revisor', 'admin']

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [hayCuentas, setHayCuentas] = useState(true)
  const [cargando, setCargando] = useState(true)

  // También se usa cuando la API responde 401 (por ejemplo, sesión vencida).
  const verificar = useCallback(async () => {
    try {
      const sesion = await api.sesion()
      setUsuario(sesion.usuario)
      setHayCuentas(sesion.hayCuentas)
    } catch {
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    verificar()
  }, [verificar])

  const ingresar = useCallback(async (correo, clave) => {
    const { usuario: u } = await api.ingresar(correo, clave)
    setUsuario(u)
    return u
  }, [])

  const salir = useCallback(async () => {
    await api.salir().catch(() => {})
    setUsuario(null)
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      hayCuentas,
      cargando,
      puedeRevisar: ROLES_REVISION.includes(usuario?.rol),
      esAdmin: usuario?.rol === 'admin',
      verificar,
      ingresar,
      salir,
    }),
    [usuario, hayCuentas, cargando, verificar, ingresar, salir]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
