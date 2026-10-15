import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { openDb } from './db/database.js'
import { seedIfEmpty } from './db/seed.js'
import { createApp } from './app.js'

const raiz = path.dirname(fileURLToPath(import.meta.url))

const db = openDb(process.env.DB_PATH ?? path.join(raiz, 'data', 'memoria-viva.db'))
seedIfEmpty(db)

const app = createApp({
  db,
  uploadsDir: process.env.UPLOADS_DIR ?? path.join(raiz, 'storage', 'uploads'),
  distDir: path.join(raiz, '..', 'dist'),
})

// API_PORT (y no PORT) para no chocar con herramientas que fijan PORT para Vite.
const PORT = Number(process.env.API_PORT ?? 3001)
app.listen(PORT, () => {
  console.log(`API de Memoria Viva escuchando en http://localhost:${PORT}`)
})
