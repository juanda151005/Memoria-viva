import express from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { createRepo } from './repositorio.js'
import { tx } from './db/database.js'
import { seed } from './db/seed.js'
import * as ia from './services/ia.js'
import {
  departamentos,
  epocas,
  tematicas as TEMATICAS,
  tiposPatrimonio,
} from '../src/data/mockData.js'

// ============================================================================
// API REST de Memoria Viva.
// createApp() recibe la base de datos y la carpeta de almacenamiento, así las
// pruebas pueden levantar una instancia aislada (BD en memoria + carpeta temporal).
// ============================================================================

export const LIMITE_ARCHIVO = 500 * 1024 * 1024 // 500 MB

const MIME_PERMITIDOS =
  /^(audio|video|image)\/|^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const texto = (v) => (typeof v === 'string' ? v.trim() : '')

// Multer entrega el nombre original en latin1; se normaliza a UTF-8 (tildes, ñ).
const nombreUtf8 = (nombre) => Buffer.from(nombre, 'latin1').toString('utf8')

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'relato'

function sha256(archivo) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    fs.createReadStream(archivo)
      .on('data', (d) => hash.update(d))
      .on('end', () => resolve(hash.digest('hex')))
      .on('error', reject)
  })
}

function parsearTematicas(valor) {
  try {
    const lista = JSON.parse(valor || '[]')
    return Array.isArray(lista) ? lista.filter((t) => TEMATICAS.includes(t)) : []
  } catch {
    return []
  }
}

function validarRelato(b) {
  const errores = []
  const obligatorios = [
    ['titulo', 'título'],
    ['comunidad', 'comunidad'],
    ['narrador', 'narrador'],
    ['departamento', 'departamento'],
    ['municipio', 'municipio'],
    ['tipo', 'tipo de patrimonio'],
  ]
  for (const [campo, etiqueta] of obligatorios) {
    if (!texto(b[campo])) errores.push(`Falta el campo obligatorio: ${etiqueta}`)
  }
  if (texto(b.titulo).length > 160) errores.push('El título no puede superar 160 caracteres')
  if (b.tipo && !tiposPatrimonio.some((t) => t.id === b.tipo)) {
    errores.push('Tipo de patrimonio no válido')
  }
  if (b.departamento && !departamentos.includes(b.departamento)) {
    errores.push('Departamento no válido')
  }
  if (b.epoca && !epocas.includes(b.epoca)) errores.push('Época no válida')
  if (b.consentimiento !== 'true') {
    errores.push('Se requiere el consentimiento de la persona narradora y de la comunidad')
  }
  return errores
}

export function createApp({ db, uploadsDir, distDir } = {}) {
  const dirSubidas = path.resolve(uploadsDir)
  fs.mkdirSync(dirSubidas, { recursive: true })

  const repo = createRepo(db)
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '100kb' }))

  // --- Almacenamiento de archivos -------------------------------------------
  // Cada archivo se guarda con un nombre aleatorio (UUID) para evitar choques y
  // rutas maliciosas; el nombre original queda solo como metadato en la BD.
  const subida = multer({
    storage: multer.diskStorage({
      destination: dirSubidas,
      filename: (req, file, cb) => {
        const ext = path.extname(nombreUtf8(file.originalname)).toLowerCase()
        cb(null, randomUUID() + (/^\.[a-z0-9]{1,8}$/.test(ext) ? ext : ''))
      },
    }),
    limits: { fileSize: LIMITE_ARCHIVO, files: 1 },
    fileFilter: (req, file, cb) =>
      MIME_PERMITIDOS.test(file.mimetype)
        ? cb(null, true)
        : cb(new HttpError(415, 'Tipo de archivo no permitido. Usa audio, video, imagen, PDF o Word.')),
  })

  // --- Rutas -----------------------------------------------------------------

  app.get('/api/salud', (req, res) => {
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM relatos').get()
    res.json({ ok: true, baseDeDatos: 'SQLite', relatos: n, version: '0.3.0' })
  })

  // Catálogo público: solo relatos aprobados por la comunidad.
  app.get('/api/relatos', (req, res) => {
    const q = req.query
    res.json(
      repo.listarPublicados({
        q: texto(q.q),
        departamento: texto(q.departamento),
        tipo: texto(q.tipo),
        tematica: texto(q.tematica),
        epoca: texto(q.epoca),
        region: texto(q.region),
        limit: texto(q.limit),
      })
    )
  })

  app.get('/api/relatos/:id', (req, res) => {
    const relato = repo.obtener(req.params.id)
    if (!relato || !relato.publicado) throw new HttpError(404, 'Relato no encontrado')
    res.json(relato)
  })

  // Registro de un relato: guarda el archivo, corre el pipeline de IA y lo
  // deja en la cola de revisión comunitaria (nunca se publica directamente).
  app.post('/api/relatos', subida.single('archivo'), async (req, res) => {
    const b = req.body ?? {}
    const errores = validarRelato(b)
    if (errores.length) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {})
      return res.status(400).json({ error: errores[0], errores })
    }

    const ahora = new Date().toISOString()
    const archivo = req.file
      ? {
          id: randomUUID(),
          nombreOriginal: nombreUtf8(req.file.originalname),
          nombreAlmacenado: req.file.filename,
          mime: req.file.mimetype,
          tipoMedio: ia.tipoMedio(req.file.mimetype),
          tamano: req.file.size,
          sha256: await sha256(req.file.path),
          creadoEn: ahora,
        }
      : null

    const id = `${slugify(texto(b.titulo))}-${randomUUID().slice(0, 6)}`
    const tematicas = parsearTematicas(b.tematicas)
    const descripcion = texto(b.descripcion) || null

    // Pipeline de IA (simulado; ver services/ia.js)
    const transcripcion = ia.transcribir({ archivo, tipo: b.tipo, descripcion })
    const { region, revisionIA } = ia.clasificar({
      departamento: b.departamento,
      tipo: b.tipo,
      tematicas,
      transcripcion,
    })
    const { iaGenerada, palette } = ia.ilustrar({ id, archivo })

    const textoCompleto = transcripcion.join(' ')
    const fragmento =
      descripcion ??
      (textoCompleto.length > 140
        ? `${textoCompleto.slice(0, 140).trimEnd()}…`
        : textoCompleto || null)

    try {
      const relato = tx(db, () => {
        if (archivo) repo.crearArchivo(archivo)
        const creado = repo.crearRelato({
          id,
          titulo: texto(b.titulo),
          comunidad: texto(b.comunidad),
          municipio: texto(b.municipio),
          departamento: b.departamento,
          region,
          narrador: texto(b.narrador),
          tipo: b.tipo,
          tematicas,
          epoca: texto(b.epoca) || 'Sin fecha definida',
          fechaRegistro: ahora.slice(0, 10),
          estado: 'en_revision',
          publicado: false,
          iaGenerada,
          palette,
          fragmento,
          transcripcion,
          revisionIA,
          descripcion,
          consentimiento: true,
          archivoId: archivo?.id ?? null,
          creadoEn: ahora,
        })
        repo.registrarActividad(`Nuevo relato recibido: "${creado.titulo}"`, id)
        return creado
      })
      res.status(201).json(relato)
    } catch (err) {
      if (req.file) await fs.promises.unlink(req.file.path).catch(() => {})
      throw err
    }
  })

  // --- Revisión comunitaria -------------------------------------------------

  app.get('/api/revision', (req, res) => {
    res.json(repo.pendientes())
  })

  const pendienteOError = (id) => {
    const relato = repo.obtener(id)
    if (!relato) throw new HttpError(404, 'Relato no encontrado')
    if (relato.estado !== 'en_revision') throw new HttpError(409, 'Este relato ya fue revisado')
    return relato
  }

  app.post('/api/relatos/:id/aprobar', (req, res) => {
    const relato = pendienteOError(req.params.id)
    const actualizado = tx(db, () => {
      const r = repo.actualizarEstado(relato.id, { estado: 'revisado', publicado: true })
      repo.registrarActividad(`Aprobado y publicado: "${relato.titulo}"`, relato.id)
      return r
    })
    res.json(actualizado)
  })

  app.post('/api/relatos/:id/rechazar', (req, res) => {
    const relato = pendienteOError(req.params.id)
    const motivo = texto(req.body?.motivo).slice(0, 500) || null
    const actualizado = tx(db, () => {
      const r = repo.actualizarEstado(relato.id, { estado: 'devuelto', publicado: false, motivo })
      repo.registrarActividad(
        `Devuelto a la comunidad: "${relato.titulo}"${motivo ? ` — ${motivo}` : ''}`,
        relato.id
      )
      return r
    })
    res.json(actualizado)
  })

  // --- Archivos, métricas y bitácora ---------------------------------------

  // Entrega el archivo original (con soporte de rangos para adelantar audio y video).
  app.get('/api/archivos/:id', (req, res) => {
    const archivo = repo.obtenerArchivo(req.params.id)
    if (!archivo) throw new HttpError(404, 'Archivo no encontrado')
    res.type(archivo.mime)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(archivo.nombre_original)}`
    )
    res.sendFile(path.join(dirSubidas, archivo.nombre_almacenado), (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'Archivo no disponible' })
    })
  })

  app.get('/api/estadisticas', (req, res) => {
    res.json(repo.estadisticas())
  })

  app.get('/api/actividad', (req, res) => {
    res.json(repo.actividad(Math.min(Number(req.query.limit) || 20, 100)))
  })

  // Reinicia los datos de demostración (solo fuera de producción).
  app.post('/api/demo/reset', async (req, res) => {
    if (process.env.NODE_ENV === 'production') throw new HttpError(403, 'No disponible')
    const archivos = repo.listarArchivos()
    tx(db, () => repo.vaciar())
    seed(db)
    await Promise.all(
      archivos.map((a) =>
        fs.promises.unlink(path.join(dirSubidas, a.nombre_almacenado)).catch(() => {})
      )
    )
    res.json({ ok: true })
  })

  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' })
  })

  // --- Frontend compilado (npm run build && npm start) ----------------------
  if (distDir && fs.existsSync(distDir)) {
    const dist = path.resolve(distDir)
    app.use(express.static(dist))
    app.use((req, res, next) =>
      req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()
    )
  }

  // --- Errores ---------------------------------------------------------------
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const muyGrande = err.code === 'LIMIT_FILE_SIZE'
      return res.status(muyGrande ? 413 : 400).json({
        error: muyGrande ? 'El archivo supera el límite de 500 MB' : err.message,
      })
    }
    if (err.status && err.status < 500) {
      return res.status(err.status).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
  })

  return app
}
