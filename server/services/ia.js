import fs from 'node:fs'
import { tematicas as TEMATICAS, tipoLabel, tiposPatrimonio } from '../../src/data/mockData.js'

// ============================================================================
// Pipeline de IA de Memoria Viva — todo corre en local y es gratuito:
//   transcribir()  -> Whisper (faster-whisper) en el servicio Python ia-service/
//   clasificar()   -> modelo de lenguaje en Ollama + reglas de contenido sensible
//   ilustrar()     -> ilustración generativa (el modelo texto-a-imagen es la siguiente fase)
// Si Ollama no está disponible, la clasificación cae a las reglas.
// ============================================================================

const REGION_POR_DEPTO = {
  Chocó: 'Pacífico',
  Nariño: 'Pacífico',
  Cauca: 'Pacífico',
  Bolívar: 'Caribe',
  Magdalena: 'Caribe',
  'La Guajira': 'Caribe',
  Amazonas: 'Amazonía',
  Boyacá: 'Andina',
}

const PALETAS = [
  ['#2F4A3C', '#D08C2E'],
  ['#3A4A7A', '#C96B45'],
  ['#8F3C20', '#D08C2E'],
  ['#B5502E', '#3A4A7A'],
  ['#2F4A3C', '#54659A'],
]

// Reglas explicables que complementan al modelo: saberes restringidos o datos
// personales que no deberían publicarse sin una revisión cuidadosa.
const EXPRESIONES_SENSIBLES = [
  { patron: 'sagrad', etiqueta: 'saber sagrado' },
  { patron: 'secreto', etiqueta: 'conocimiento secreto' },
  { patron: 'no se cuenta', etiqueta: 'relato de circulación restringida' },
  { patron: 'cédula', etiqueta: 'número de cédula' },
  { patron: 'teléfono', etiqueta: 'número de teléfono' },
  { patron: 'dirección de', etiqueta: 'dirección' },
]

const MAX_CARACTERES_LLM = 6000

export class ServicioNoDisponible extends Error {}

export function tipoMedio(mime = '') {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'imagen'
  return 'documento'
}

export const regionDe = (departamento) => REGION_POR_DEPTO[departamento] ?? 'Andina'

function hash(texto) {
  let h = 0
  for (const c of texto) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

// Texto-a-imagen: solo se ilustra cuando no hay registro visual original.
export function ilustrar({ id, archivo }) {
  const tieneVisual = Boolean(archivo && ['imagen', 'video'].includes(archivo.tipoMedio))
  return {
    iaGenerada: !tieneVisual,
    palette: PALETAS[hash(id) % PALETAS.length],
  }
}

export function detectarSensibles(transcripcion = []) {
  const texto = transcripcion.join(' ').toLowerCase()
  return EXPRESIONES_SENSIBLES.filter((e) => texto.includes(e.patron)).map((e) => e.etiqueta)
}

// Combina lo que propone el modelo (si lo hay) con las reglas y calcula una
// confianza explicable: cada discrepancia o alerta la reduce.
function armarRevision({ tipo, tematicas = [], transcripcion = [], modelo, fuente }) {
  const alertasReglas = detectarSensibles(transcripcion)
  const alertasModelo = modelo?.alertas ?? []
  const sugerencias = [`Registrado como ${tipoLabel(tipo)}`]
  let confianza = 0.95

  if (modelo && modelo.tipo !== tipo) {
    sugerencias.push(`La IA sugiere clasificarlo como ${tipoLabel(modelo.tipo)}`)
    confianza -= 0.15
  }
  if (modelo?.tematicas.length && tematicas.length) {
    const comunes = modelo.tematicas.filter((t) => tematicas.includes(t))
    if (!comunes.length) {
      sugerencias.push(`Temáticas sugeridas: ${modelo.tematicas.join(', ')}`)
      confianza -= 0.05
    }
  }
  if (!tematicas.length && !modelo?.tematicas.length) {
    sugerencias.push('Sin temáticas: revisar la clasificación')
    confianza -= 0.08
  }
  if (!transcripcion.length) {
    sugerencias.push('Sin transcripción: no hay audio con voz ni descripción')
    confianza -= 0.15
  }
  if (!modelo) confianza -= 0.05

  const alertas = [...new Set([...alertasReglas, ...alertasModelo])]
  confianza -= Math.min(alertas.length, 3) * 0.1
  sugerencias.push(
    alertas.length
      ? `Revisar con cuidado: ${alertas.length} ${alertas.length === 1 ? 'alerta' : 'alertas'} de contenido sensible`
      : 'Sin lenguaje sensible'
  )

  return {
    confianza: Math.max(0.4, Math.round(confianza * 100) / 100),
    sugerencias,
    fuente,
    tipoSugerido: modelo?.tipo ?? null,
    tematicasSugeridas: modelo?.tematicas ?? [],
    resumen: modelo?.resumen || null,
    alertas,
  }
}

// Clasificación solo con reglas (relatos semilla y respaldo sin Ollama).
export function clasificarConReglas({ departamento, tipo, tematicas, transcripcion }) {
  return {
    region: regionDe(departamento),
    tematicas: tematicas ?? [],
    revisionIA: armarRevision({ tipo, tematicas, transcripcion, fuente: 'reglas' }),
  }
}

const ESQUEMA_CLASIFICACION = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: tiposPatrimonio.map((t) => t.id) },
    tematicas: {
      type: 'array',
      items: { type: 'string', enum: TEMATICAS },
      maxItems: 3,
    },
    resumen: { type: 'string' },
    alertas: { type: 'array', items: { type: 'string' } },
  },
  required: ['tipo', 'tematicas', 'resumen', 'alertas'],
}

const INSTRUCCIONES = `Eres un asistente de catalogación de patrimonio cultural colombiano para la plataforma Memoria Viva.
Analizas el relato de una comunidad y propones su clasificación. Una persona de la comunidad revisará tu propuesta.
Reglas:
- Usa solo información presente en el texto; no inventes.
- "tipo": uno de: ${tiposPatrimonio.map((t) => `${t.id} (${t.label})`).join(', ')}.
- "tematicas": entre 1 y 3 de esta lista exacta: ${TEMATICAS.join(', ')}.
- "resumen": una sola frase en español, máximo 30 palabras.
- "alertas": frases cortas en español SOLO si el texto contiene datos personales de contacto (teléfonos, direcciones, documentos) o saberes que el propio relato presenta como sagrados, secretos o de circulación restringida. Si no hay, lista vacía.
Responde únicamente con el JSON pedido.`

export function crearServicioIA({
  whisperUrl = 'http://127.0.0.1:8001',
  ollamaUrl = 'http://127.0.0.1:11434',
  ollamaModelo = 'mistral',
  esperaModeloWhisperMs = 10 * 60 * 1000,
  reintentoMs = 3000,
} = {}) {
  const pedir = async (url, opciones, mensajeCaida) => {
    try {
      return await fetch(url, opciones)
    } catch (err) {
      if (err.name === 'TimeoutError') throw new ServicioNoDisponible(`${mensajeCaida} (tiempo agotado)`)
      throw new ServicioNoDisponible(mensajeCaida)
    }
  }

  async function saludWhisper() {
    try {
      const res = await fetch(`${whisperUrl}/salud`, { signal: AbortSignal.timeout(2000) })
      const data = await res.json()
      return { ok: data.ok, estado: data.estado, modelo: `whisper-${data.modelo}`, error: data.error }
    } catch {
      return { ok: false, estado: 'apagado', modelo: null }
    }
  }

  async function saludOllama() {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
      const { models = [] } = await res.json()
      const instalado = models.some(
        (m) => m.name === ollamaModelo || m.name === `${ollamaModelo}:latest`
      )
      return {
        ok: instalado,
        estado: instalado ? 'listo' : 'sin-modelo',
        modelo: ollamaModelo,
      }
    } catch {
      return { ok: false, estado: 'apagado', modelo: ollamaModelo }
    }
  }

  return {
    async salud() {
      const [whisper, clasificador] = await Promise.all([saludWhisper(), saludOllama()])
      return { whisper, clasificador }
    },

    // Envía el archivo al servicio de Whisper. Si el modelo aún se está cargando
    // (503), espera y reintenta.
    async transcribir({ ruta, nombre, mime }) {
      const limite = Date.now() + esperaModeloWhisperMs
      for (;;) {
        const formulario = new FormData()
        formulario.append('archivo', await fs.openAsBlob(ruta, { type: mime }), nombre)
        const res = await pedir(
          `${whisperUrl}/transcribir`,
          { method: 'POST', body: formulario, signal: AbortSignal.timeout(60 * 60 * 1000) },
          'El servicio de transcripción (Whisper) no está corriendo. Inícialo con "npm run dev:ia".'
        )
        if (res.status === 503 && Date.now() < limite) {
          await new Promise((r) => setTimeout(r, reintentoMs))
          continue
        }
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.detail ?? `Whisper respondió con error ${res.status}`)
        return data
      }
    },

    // Clasificación con el modelo de Ollama; si no responde, solo reglas.
    // Al modelo no se le dice el tipo registrado: así da una segunda opinión
    // independiente, que luego se compara con lo que eligió la persona.
    async clasificar({ titulo, descripcion, departamento, tipo, tematicas = [], transcripcion = [] }) {
      const region = regionDe(departamento)
      const texto = transcripcion.join('\n').slice(0, MAX_CARACTERES_LLM)
      const contenido = [
        `Título: ${titulo}`,
        descripcion ? `Descripción de quien lo registra: ${descripcion}` : null,
        `Transcripción:\n${texto || '(sin transcripción)'}`,
      ]
        .filter(Boolean)
        .join('\n')

      let modelo = null
      try {
        const res = await pedir(
          `${ollamaUrl}/api/chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: ollamaModelo,
              stream: false,
              format: ESQUEMA_CLASIFICACION,
              options: { temperature: 0, num_ctx: 4096 },
              messages: [
                { role: 'system', content: INSTRUCCIONES },
                { role: 'user', content: contenido },
              ],
            }),
            signal: AbortSignal.timeout(5 * 60 * 1000),
          },
          'Ollama no está disponible'
        )
        if (!res.ok) throw new Error(`Ollama respondió con error ${res.status}`)
        const respuesta = JSON.parse((await res.json()).message.content)
        // Se valida lo que devuelve el modelo antes de usarlo.
        modelo = {
          tipo: tiposPatrimonio.some((t) => t.id === respuesta.tipo) ? respuesta.tipo : tipo,
          tematicas: (respuesta.tematicas ?? []).filter((t) => TEMATICAS.includes(t)).slice(0, 3),
          resumen: String(respuesta.resumen ?? '').trim().slice(0, 300),
          alertas: (respuesta.alertas ?? []).map((a) => String(a).trim()).filter(Boolean).slice(0, 5),
        }
      } catch (err) {
        console.warn(`[ia] Clasificación solo con reglas: ${err.message}`)
      }

      const revisionIA = armarRevision({
        tipo,
        tematicas,
        transcripcion,
        modelo,
        fuente: modelo ? `ollama:${ollamaModelo}` : 'reglas',
      })
      // Si quien registró no eligió temáticas, se proponen las del modelo.
      return {
        region,
        tematicas: tematicas.length ? tematicas : modelo?.tematicas ?? [],
        revisionIA,
      }
    },
  }
}
