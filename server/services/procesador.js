import path from 'node:path'
import { ServicioNoDisponible } from './ia.js'

// ============================================================================
// Procesador en segundo plano: transcribe y clasifica los relatos recibidos.
// Atiende uno a la vez (Whisper usa toda la CPU) y, al arrancar el servidor,
// retoma los que quedaron a medias.
//   pendiente -> transcribiendo -> clasificando -> listo   (o error)
// ============================================================================

const formatoDuracion = (segundos) => {
  const s = Math.round(segundos)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function crearProcesador({ repo, ia, uploadsDir }) {
  const cola = []
  let enCurso = null

  async function procesar(id) {
    const relato = repo.obtener(id)
    if (!relato) return

    let { transcripcion } = relato
    const medio = relato.archivo?.tipoMedio

    if (medio === 'audio' || medio === 'video') {
      repo.marcarProcesamiento(id, 'transcribiendo')
      const archivo = repo.obtenerArchivo(relato.archivo.id)
      const resultado = await ia.transcribir({
        ruta: path.join(uploadsDir, archivo.nombre_almacenado),
        nombre: archivo.nombre_original,
        mime: archivo.mime,
      })
      transcripcion = resultado.parrafos
      const texto = transcripcion.join(' ')
      repo.guardarTranscripcion(id, {
        transcripcion,
        duracion: formatoDuracion(resultado.duracion),
        idioma: resultado.idioma,
        // El fragmento público es texto literal del relato, nunca un resumen generado.
        fragmento:
          relato.descripcion || !texto
            ? null
            : texto.length > 140
            ? `${texto.slice(0, 140).trimEnd()}…`
            : texto,
      })
    }

    repo.marcarProcesamiento(id, 'clasificando')
    const clasificacion = await ia.clasificar({ ...relato, transcripcion })
    repo.guardarClasificacion(id, clasificacion)
    repo.marcarProcesamiento(id, 'listo')
    repo.registrarActividad(`IA terminó de procesar: "${relato.titulo}"`, id)
  }

  async function atenderCola() {
    while (cola.length) {
      const id = cola.shift()
      try {
        await procesar(id)
      } catch (err) {
        const mensaje =
          err instanceof ServicioNoDisponible
            ? err.message
            : `No se pudo procesar con IA: ${err.message}`
        console.error(`[procesador] ${id}: ${mensaje}`)
        repo.marcarProcesamiento(id, 'error', mensaje)
      }
    }
    enCurso = null
  }

  return {
    encolar(id) {
      if (!cola.includes(id)) cola.push(id)
      if (!enCurso) enCurso = atenderCola()
    },

    // Retoma lo que quedó pendiente si el servidor se reinició a mitad de camino.
    reanudar() {
      for (const id of repo.idsPorProcesar()) {
        repo.marcarProcesamiento(id, 'pendiente')
        this.encolar(id)
      }
    },

    // Para las pruebas: espera a que la cola quede vacía.
    inactivo: () => enCurso ?? Promise.resolve(),
  }
}
