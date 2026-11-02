// ============================================================================
// Cliente de la API de Memoria Viva. Todas las llamadas al backend pasan por
// aquí; en desarrollo Vite redirige /api al servidor Express (puerto 3001).
// ============================================================================

const BASE = '/api'

const SIN_CONEXION =
  'No hay conexión con el servidor. Verifica que la API esté corriendo (npm run dev).'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(ruta, opciones) {
  let res
  try {
    res = await fetch(BASE + ruta, opciones)
  } catch {
    throw new ApiError(SIN_CONEXION, 0)
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // El proxy de Vite responde 500/502 sin JSON cuando la API está apagada.
    const caida = !data && res.status >= 500
    throw new ApiError(caida ? SIN_CONEXION : data?.error ?? `Error ${res.status}`, res.status)
  }
  return data
}

const query = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return qs ? `?${qs}` : ''
}

const post = (ruta, body) =>
  request(ruta, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

const id = (v) => encodeURIComponent(v)

export const api = {
  salud: () => request('/salud'),
  listarRelatos: (filtros) => request(`/relatos${query(filtros)}`),
  obtenerRelato: (relatoId) => request(`/relatos/${id(relatoId)}`),
  pendientes: () => request('/revision'),
  aprobar: (relatoId) => post(`/relatos/${id(relatoId)}/aprobar`),
  rechazar: (relatoId, motivo) => post(`/relatos/${id(relatoId)}/rechazar`, { motivo }),
  procesamiento: (relatoId) => request(`/procesamiento/${id(relatoId)}`),
  reprocesar: (relatoId) => post(`/relatos/${id(relatoId)}/reprocesar`),
  actividad: () => request('/actividad'),
  estadisticas: () => request('/estadisticas'),
  reiniciarDemo: () => post('/demo/reset'),

  // Usa XMLHttpRequest (y no fetch) para poder reportar el progreso real de la
  // subida del archivo. onProgreso recibe un valor entre 0 y 1.
  subirRelato(formData, onProgreso) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${BASE}/relatos`)
      xhr.responseType = 'json'
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgreso?.(e.loaded / e.total)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve(xhr.response)
        const caida = !xhr.response && xhr.status >= 500
        reject(
          new ApiError(
            caida ? SIN_CONEXION : xhr.response?.error ?? `Error ${xhr.status}`,
            xhr.status
          )
        )
      }
      xhr.onerror = () => reject(new ApiError(SIN_CONEXION, 0))
      xhr.send(formData)
    })
  },
}
