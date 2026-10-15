import { useEffect, useState } from 'react'

// Ejecuta una consulta a la API cuando cambian las dependencias.
// Conserva los datos anteriores mientras recarga, para evitar parpadeos.
export function useApi(consulta, deps) {
  const [estado, setEstado] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let vigente = true
    setEstado((s) => ({ ...s, loading: true, error: null }))
    consulta()
      .then((data) => vigente && setEstado({ data, loading: false, error: null }))
      .catch((error) => vigente && setEstado({ data: null, loading: false, error }))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return estado
}
