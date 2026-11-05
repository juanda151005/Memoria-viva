import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'

// ============================================================================
// Base de datos — SQLite embebido (módulo node:sqlite, sin servidor aparte).
// Los campos de lista (temáticas, transcripción, etc.) se guardan como JSON.
// Para producción el mismo esquema se puede llevar a PostgreSQL.
// ============================================================================

const SCHEMA = `
CREATE TABLE IF NOT EXISTS archivos (
  id                TEXT PRIMARY KEY,
  nombre_original   TEXT NOT NULL,
  nombre_almacenado TEXT NOT NULL UNIQUE,
  mime              TEXT NOT NULL,
  tipo_medio        TEXT NOT NULL CHECK (tipo_medio IN ('audio', 'video', 'imagen', 'documento')),
  tamano            INTEGER NOT NULL,
  sha256            TEXT NOT NULL,
  creado_en         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS relatos (
  id                TEXT PRIMARY KEY,
  titulo            TEXT NOT NULL,
  comunidad         TEXT NOT NULL,
  municipio         TEXT NOT NULL,
  departamento      TEXT NOT NULL,
  region            TEXT NOT NULL,
  narrador          TEXT NOT NULL,
  tipo              TEXT NOT NULL,
  tematicas         TEXT NOT NULL DEFAULT '[]',
  epoca             TEXT,
  fecha_registro    TEXT NOT NULL,
  estado            TEXT NOT NULL CHECK (estado IN ('en_revision', 'revisado', 'devuelto')),
  publicado         INTEGER NOT NULL DEFAULT 0,
  publicado_en      TEXT,
  motivo_devolucion TEXT,
  duracion          TEXT,
  ia_generada       INTEGER NOT NULL DEFAULT 1,
  palette           TEXT,
  fragmento         TEXT,
  transcripcion     TEXT NOT NULL DEFAULT '[]',
  revision_ia       TEXT,
  descripcion       TEXT,
  consentimiento    INTEGER NOT NULL DEFAULT 0,
  archivo_id        TEXT REFERENCES archivos(id),
  creado_en         TEXT NOT NULL,
  actualizado_en    TEXT
);

CREATE INDEX IF NOT EXISTS idx_relatos_publicado ON relatos (publicado, publicado_en);
CREATE INDEX IF NOT EXISTS idx_relatos_estado ON relatos (estado);

CREATE TABLE IF NOT EXISTS actividad (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  texto     TEXT NOT NULL,
  relato_id TEXT,
  fecha     TEXT NOT NULL
);

-- Cuentas de las personas revisoras y administradoras. La contraseña se guarda
-- solo como hash (scrypt con sal aleatoria).
CREATE TABLE IF NOT EXISTS usuarios (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  correo         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  clave_hash     TEXT NOT NULL,
  rol            TEXT NOT NULL CHECK (rol IN ('revisor', 'admin')),
  activo         INTEGER NOT NULL DEFAULT 1,
  creado_en      TEXT NOT NULL,
  ultimo_ingreso TEXT
);

-- El id es el hash SHA-256 del token: el token en claro solo vive en la cookie.
CREATE TABLE IF NOT EXISTS sesiones (
  id         TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creado_en  TEXT NOT NULL,
  expira_en  TEXT NOT NULL
);
`

// Columnas agregadas después de la primera versión del esquema. Se añaden a
// bases existentes sin perder datos.
//   procesamiento: pendiente | transcribiendo | clasificando | listo | error
const MIGRACIONES = [
  ['procesamiento', "TEXT NOT NULL DEFAULT 'listo'"],
  ['procesamiento_error', 'TEXT'],
  ['idioma', 'TEXT'],
  ['revisado_por', 'TEXT'], // id del usuario que aprobó o devolvió el relato
]

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new DatabaseSync(file)
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(SCHEMA)

  const columnas = new Set(db.prepare('PRAGMA table_info(relatos)').all().map((c) => c.name))
  for (const [nombre, definicion] of MIGRACIONES) {
    if (!columnas.has(nombre)) db.exec(`ALTER TABLE relatos ADD COLUMN ${nombre} ${definicion}`)
  }
  return db
}

// Ejecuta fn dentro de una transacción: todo se guarda o nada se guarda.
export function tx(db, fn) {
  db.exec('BEGIN')
  try {
    const resultado = fn()
    db.exec('COMMIT')
    return resultado
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
