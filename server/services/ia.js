import { tipoLabel } from '../../src/data/mockData.js'

// ============================================================================
// Pipeline de IA — SIMULADO en esta fase.
// Cada función es el punto exacto donde se conecta el modelo real:
//   transcribir() -> Whisper (ASR)
//   clasificar()  -> LLM / clasificador NLP
//   ilustrar()    -> modelo texto-a-imagen
// La firma de entrada y salida ya es la definitiva, así que reemplazar la
// simulación no obliga a tocar la API ni el frontend.
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

// Expresiones que piden una revisión más cuidadosa: saberes restringidos o
// datos personales que no deberían publicarse sin confirmación.
const EXPRESIONES_SENSIBLES = [
  { patron: 'sagrad', etiqueta: 'saber sagrado' },
  { patron: 'secreto', etiqueta: 'conocimiento secreto' },
  { patron: 'no se cuenta', etiqueta: 'relato de circulación restringida' },
  { patron: 'cédula', etiqueta: 'número de cédula' },
  { patron: 'teléfono', etiqueta: 'número de teléfono' },
  { patron: 'dirección de', etiqueta: 'dirección' },
]

const TRANSCRIPCIONES_DEMO = {
  oralitura: [
    'Cuentan los mayores que en el tiempo de antes, cuando el río todavía hablaba con la gente, había que pedirle permiso al agua antes de pescar. El que no pedía permiso volvía con la canoa vacía.',
    'Eso me lo contó mi abuela una noche de luna llena, y yo se lo cuento ahora a mis nietos, para que no se les olvide que el territorio también escucha.',
  ],
  musica: [
    'Este canto lo aprendí de mi mamá, que lo cantaba mientras trabajaba. Uno canta y el coro responde, y así se va armando la fiesta.',
    'Antes se cantaba en los velorios, en las fiestas del santo y cuando llegaba alguien al pueblo. Hoy lo cantamos para que los jóvenes sepan de dónde vienen.',
  ],
  saber: [
    'Esta planta se recoge en luna menguante, temprano, antes de que el sol la caliente. Se machaca con la mano, nunca con metal, y se deja reposar en agua fría.',
    'Los mayores dicen que la planta tiene su espíritu y hay que hablarle. Ese saber se enseña en la casa, de mayor a joven, y por eso hay que cuidarlo.',
  ],
  oficio: [
    'Para tejer hay que tener paciencia. Primero se prepara la fibra, se seca al sol y se tiñe con lo que da el monte: achiote, jagua, barro.',
    'Mi mamá me enseñó a contar los puntos con los dedos. Cada figura tiene un nombre y cuenta algo de nuestra gente; quien sabe leerla, entiende la historia.',
  ],
  obra: [
    'Esta obra nació de una conversación con los vecinos del barrio. Les preguntamos qué querían recordar y a quién querían honrar.',
    'Usamos los colores del río y de la selva. Cada figura es alguien real de la comunidad, porque el arte aquí es memoria, no adorno.',
  ],
}

export function tipoMedio(mime = '') {
  if (mime.startsWith('audio/')) return 'audio'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('image/')) return 'imagen'
  return 'documento'
}

function hash(texto) {
  let h = 0
  for (const c of texto) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

// ASR: audio/video -> texto. Sin audio no hay nada que transcribir y se usa
// la descripción escrita por la persona que registra.
export function transcribir({ archivo, tipo, descripcion }) {
  if (!archivo || !['audio', 'video'].includes(archivo.tipoMedio)) {
    return descripcion ? [descripcion] : []
  }
  return TRANSCRIPCIONES_DEMO[tipo] ?? TRANSCRIPCIONES_DEMO.oralitura
}

// NLP: región, sugerencias para el revisor y nivel de confianza.
export function clasificar({ departamento, tipo, tematicas = [], transcripcion = [] }) {
  const region = REGION_POR_DEPTO[departamento] ?? 'Andina'
  const texto = transcripcion.join(' ').toLowerCase()
  const sensibles = EXPRESIONES_SENSIBLES.filter((e) => texto.includes(e.patron)).map(
    (e) => e.etiqueta
  )

  const sugerencias = [`Clasificado como ${tipoLabel(tipo)}`, `Región ${region} detectada`]
  if (!tematicas.length) sugerencias.push('Sin temáticas: revisar la clasificación')
  if (!transcripcion.length) sugerencias.push('Sin transcripción: no hay audio ni descripción')
  sugerencias.push(
    sensibles.length
      ? `Revisar con cuidado: posible ${sensibles.join(', ')}`
      : 'Sin lenguaje sensible'
  )

  let confianza = 0.95
  if (!tematicas.length) confianza -= 0.08
  if (!transcripcion.length) confianza -= 0.15
  confianza -= sensibles.length * 0.1

  return {
    region,
    revisionIA: {
      confianza: Math.max(0.5, Math.round(confianza * 100) / 100),
      sugerencias,
    },
  }
}

// Texto-a-imagen: solo se ilustra cuando no hay registro visual original.
export function ilustrar({ id, archivo }) {
  const tieneVisual = Boolean(archivo && ['imagen', 'video'].includes(archivo.tipoMedio))
  return {
    iaGenerada: !tieneVisual,
    palette: PALETAS[hash(id) % PALETAS.length],
  }
}
