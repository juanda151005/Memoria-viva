import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

// ============================================================================
// StoreContext — estado compartido del flujo de revisión, sincronizado con la
// API. Las estadísticas son públicas; la cola de revisión y la bitácora solo
// se cargan con una sesión de revisor o administrador. El catálogo y el
// detalle consultan la API directamente desde sus páginas.
// ============================================================================

const StoreContext = createContext(null)

// Estados en los que la IA todavía está trabajando sobre un relato.
export const EN_PROCESO = ['pendiente', 'transcribiendo', 'clasificando']

export function StoreProvider({ children }) {
  const { puedeRevisar, cargando: cargandoSesion, verificar } = useAuth()
  const [pendientes, setPendientes] = useState([])
  const [actividad, setActividad] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(true)

  const refrescar = useCallback(async () => {
    try {
      const [e, p, a] = await Promise.all([
        api.estadisticas(),
        puedeRevisar ? api.pendientes() : [],
        puedeRevisar ? api.actividad() : [],
      ])
      setEstadisticas(e)
      setPendientes(p)
      setActividad(a)
      setError(null)
    } catch (err) {
      // 401: la sesión venció; se vuelve a consultar quién está conectado.
      if (err.status === 401) verificar()
      else setError(err)
    } finally {
      setCargando(false)
    }
  }, [puedeRevisar, verificar])

  useEffect(() => {
    if (!cargandoSesion) refrescar()
  }, [cargandoSesion, refrescar])

  // Mientras haya relatos procesándose con IA, se consulta la API cada 3 s
  // para que la cola refleje cuándo terminan.
  const hayEnProceso = pendientes.some((r) => EN_PROCESO.includes(r.procesamiento))
  useEffect(() => {
    if (!hayEnProceso) return
    const iv = setInterval(refrescar, 3000)
    return () => clearInterval(iv)
  }, [hayEnProceso, refrescar])

  const aprobar = useCallback(
    async (id) => {
      const relato = await api.aprobar(id)
      await refrescar()
      return relato
    },
    [refrescar]
  )

  const rechazar = useCallback(
    async (id, motivo) => {
      const relato = await api.rechazar(id, motivo)
      await refrescar()
      return relato
    },
    [refrescar]
  )

  const subirRelato = useCallback(
    async (formData, onProgreso) => {
      const relato = await api.subirRelato(formData, onProgreso)
      await refrescar()
      return relato
    },
    [refrescar]
  )

  const reprocesar = useCallback(
    async (id) => {
      const relato = await api.reprocesar(id)
      await refrescar()
      return relato
    },
    [refrescar]
  )

  const reiniciarDemo = useCallback(async () => {
    await api.reiniciarDemo()
    await refrescar()
  }, [refrescar])

  const value = useMemo(
    () => ({
      pendientes,
      actividad,
      estadisticas,
      error,
      cargando,
      refrescar,
      aprobar,
      rechazar,
      subirRelato,
      reprocesar,
      reiniciarDemo,
    }),
    [
      pendientes,
      actividad,
      estadisticas,
      error,
      cargando,
      refrescar,
      aprobar,
      rechazar,
      subirRelato,
      reprocesar,
      reiniciarDemo,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
