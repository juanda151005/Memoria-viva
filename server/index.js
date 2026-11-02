import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openDb } from './db/database.js'
import { seedIfEmpty } from './db/seed.js'
import { createApp } from './app.js'
import { crearServicioIA } from './services/ia.js'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const env = process.env

const db = openDb(env.DB_PATH ?? path.join(raiz, 'data', 'memoria-viva.db'))
seedIfEmpty(db)

const ia = crearServicioIA({
  whisperUrl: env.WHISPER_URL ?? `http://127.0.0.1:${env.IA_PORT ?? 8001}`,
  ollamaUrl: env.OLLAMA_URL ?? 'http://127.0.0.1:11434',
  ollamaModelo: env.OLLAMA_MODELO ?? 'mistral',
})

const app = createApp({
  db,
  ia,
  uploadsDir: env.UPLOADS_DIR ?? path.join(raiz, 'storage', 'uploads'),
  distDir: path.join(raiz, '..', 'dist'),
})

// Retoma los relatos que quedaron a medio procesar en la ejecución anterior.
app.locals.procesador.reanudar()

// API_PORT (y no PORT) para no chocar con herramientas que fijan PORT para Vite.
const PORT = Number(env.API_PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`API de Memoria Viva escuchando en http://localhost:${PORT}`)
})
