export function formatoBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

export function formatoDuracion(segundos = 0) {
  if (!Number.isFinite(segundos)) return '0:00'
  const m = Math.floor(segundos / 60)
  const s = Math.floor(segundos % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// Fechas "AAAA-MM-DD" se interpretan en UTC; sin esto, en Colombia (UTC-5)
// se mostrarían un día antes.
export function formatoFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: fecha?.length === 10 ? 'UTC' : undefined,
  })
}

export const etiquetaMedio = {
  audio: '🎙️ Audio',
  video: '🎬 Video',
  imagen: '📷 Imagen',
  documento: '📄 Documento',
}
