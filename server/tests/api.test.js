import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import express from 'express'
import multer from 'multer'
import { openDb } from '../db/database.js'
import { seed } from '../db/seed.js'
import { createApp } from '../app.js'
import { crearServicioIA } from '../services/ia.js'
import { createRepo } from '../repositorio.js'
import { crearCuenta } from '../auth.js'

// Pruebas de integración de la API. Cada corrida usa una base de datos en
// memoria, una carpeta temporal y dos servidores falsos que imitan a Whisper
// y a Ollama, para probar también el código que se comunica con ellos.

let tmp
let app
const servidores = []

const levantar = (aplicacion) =>
  new Promise((resolve) => {
    const s = aplicacion.listen(0, '127.0.0.1', () => {
      servidores.push(s)
      resolve(`http://127.0.0.1:${s.address().port}`)
    })
  })

// --- Whisper falso -----------------------------------------------------------
const whisper = { modo: 'ok', recibidos: [], liberar: null }

function whisperFalso() {
  const w = express()
  w.get('/salud', (req, res) => res.json({ ok: true, estado: 'listo', modelo: 'small' }))
  w.post('/transcribir', multer().single('archivo'), async (req, res) => {
    if (whisper.modo === 'apagado') return req.socket.destroy()
    if (whisper.modo === 'cargando') {
      whisper.modo = 'ok' // solo la primera vez
      return res.status(503).json({ detail: 'cargando' })
    }
    if (whisper.modo === 'lento') await new Promise((r) => (whisper.liberar = r))
    whisper.recibidos.push({ nombre: req.file.originalname, bytes: req.file.buffer })
    res.json({
      parrafos: ['Mi abuela cantaba bullerengue en la plaza.', 'Así aprendí el canto de mi gente.'],
      idioma: 'es',
      duracion: 65.2,
      modelo: 'small',
    })
  })
  return w
}

// --- Ollama falso ------------------------------------------------------------
const ollama = { modo: 'ok', ultimaPeticion: null }

function ollamaFalso() {
  const o = express()
  o.use(express.json())
  o.get('/api/tags', (req, res) => res.json({ models: [{ name: 'mistral:latest' }] }))
  o.post('/api/chat', (req, res) => {
    if (ollama.modo === 'apagado') return req.socket.destroy()
    ollama.ultimaPeticion = req.body
    res.json({
      message: {
        content: JSON.stringify({
          tipo: 'oralitura',
          tematicas: ['Música y danza', 'Familia', 'Inventada'],
          resumen: 'Una cantadora recuerda cómo aprendió el bullerengue.',
          alertas: [],
        }),
      },
    })
  })
  return o
}

let origen
let repo
const api = (ruta, opciones) => fetch(`${origen}/api${ruta}`, opciones)
const json = async (ruta, opciones) => (await api(ruta, opciones)).json()
const procesado = async (id) => {
  await app.locals.procesador.inactivo()
  return json(`/procesamiento/${id}`)
}

// --- Sesiones de prueba --------------------------------------------------------
// Las contraseñas se generan al vuelo en cada corrida; no quedan en el código.
const claveAleatoria = () => `prueba-${Math.random().toString(36).slice(2)}-${Date.now()}`
const cuentas = {}

async function crearYEntrar(nombre, correo, rol) {
  const clave = claveAleatoria()
  await crearCuenta(repo, { nombre, correo, rol, clave })
  const res = await ingresar(correo, clave)
  assert.equal(res.status, 200)
  return { nombre, correo, clave, cookie: res.headers.get('set-cookie').split(';')[0] }
}

const ingresar = (correo, clave) =>
  api('/auth/ingresar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, clave }),
  })

// Petición con la sesión de una cuenta (por defecto, la revisora).
const como = (cuenta, ruta, opciones = {}) =>
  api(ruta, { ...opciones, headers: { ...opciones.headers, Cookie: cuenta.cookie } })
const comoRevisor = (ruta, opciones) => como(cuentas.revisora, ruta, opciones)
const jsonRevisor = async (ruta, opciones) => (await comoRevisor(ruta, opciones)).json()

function formulario(campos = {}, archivo) {
  const fd = new FormData()
  const base = {
    titulo: 'La danza del bullerengue en la plaza',
    comunidad: 'Cantadoras de María la Baja',
    narrador: 'Petrona Martínez',
    departamento: 'Bolívar',
    municipio: 'María la Baja',
    tipo: 'musica',
    epoca: 'Después de 2000',
    tematicas: JSON.stringify(['Música y danza']),
    consentimiento: 'true',
    ...campos,
  }
  for (const [k, v] of Object.entries(base)) if (v !== undefined) fd.append(k, v)
  if (archivo) fd.append('archivo', new Blob([archivo.bytes], { type: archivo.mime }), archivo.nombre)
  return fd
}

const bytesAudio = Buffer.from('RIFF grabación de prueba — Memoria Viva')
const conAudio = (campos) =>
  api('/relatos', {
    method: 'POST',
    body: formulario(campos, { bytes: bytesAudio, mime: 'audio/wav', nombre: 'canción ñandú.wav' }),
  })

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'memoria-viva-test-'))
  const ia = crearServicioIA({
    whisperUrl: await levantar(whisperFalso()),
    ollamaUrl: await levantar(ollamaFalso()),
    ollamaModelo: 'mistral',
    reintentoMs: 20,
  })
  const db = openDb(':memory:')
  seed(db)
  repo = createRepo(db)
  app = createApp({ db, ia, uploadsDir: path.join(tmp, 'uploads') })
  origen = await levantar(app)
  cuentas.revisora = await crearYEntrar('Ana Revisora', 'ana@prueba.co', 'revisor')
  cuentas.admin = await crearYEntrar('Luis Admin', 'luis@prueba.co', 'admin')
})

beforeEach(() => {
  whisper.modo = 'ok'
  ollama.modo = 'ok'
})

after(() => {
  for (const s of servidores) {
    s.closeAllConnections()
    s.close()
  }
  fs.rmSync(tmp, { recursive: true, force: true })
})

// --- Catálogo ----------------------------------------------------------------

test('GET /api/salud informa el estado de Whisper y del clasificador', async () => {
  const salud = await json('/salud')
  assert.equal(salud.ok, true)
  assert.equal(salud.servicios.whisper.ok, true)
  assert.equal(salud.servicios.clasificador.ok, true)
})

test('el catálogo solo expone relatos publicados', async () => {
  const relatos = await json('/relatos')
  assert.ok(relatos.length > 0)
  assert.ok(relatos.every((r) => r.publicado && r.estado === 'revisado'))
})

test('filtra por departamento y por temática', async () => {
  const choco = await json('/relatos?departamento=Choc%C3%B3')
  assert.ok(choco.length > 0)
  assert.ok(choco.every((r) => r.departamento === 'Chocó'))

  const rituales = await json('/relatos?tematica=Rituales')
  assert.ok(rituales.length > 0)
  assert.ok(rituales.every((r) => r.tematicas.includes('Rituales')))
})

test('busca por texto libre', async () => {
  const resultado = await json('/relatos?q=Palenque')
  assert.ok(resultado.some((r) => r.id === 'lumbalu-palenque'))
  assert.deepEqual(await json('/relatos?q=zzzz-no-existe'), [])
})

test('un relato sin aprobar no es visible en el detalle público', async () => {
  assert.equal((await api('/relatos/pend-arrullo-guapi')).status, 404)
})

// --- Registro y validación ---------------------------------------------------

test('rechaza registros sin consentimiento comunitario (400)', async () => {
  const res = await api('/relatos', { method: 'POST', body: formulario({ consentimiento: undefined }) })
  assert.equal(res.status, 400)
  assert.match((await res.json()).error, /consentimiento/)
})

test('rechaza tipos de archivo no permitidos (415)', async () => {
  const res = await api('/relatos', {
    method: 'POST',
    body: formulario({}, { bytes: 'MZ', mime: 'application/x-msdownload', nombre: 'virus.exe' }),
  })
  assert.equal(res.status, 415)
})

// --- Pipeline de IA ----------------------------------------------------------

let relatoConAudio

test('un audio se guarda, se transcribe con Whisper y se clasifica con Ollama', async () => {
  whisper.recibidos = []
  const res = await conAudio()
  assert.equal(res.status, 202)
  const recibido = await res.json()
  assert.equal(recibido.procesamiento, 'pendiente')
  assert.equal(recibido.archivo.nombre, 'canción ñandú.wav')

  relatoConAudio = await procesado(recibido.id)
  assert.equal(relatoConAudio.procesamiento, 'listo')

  // Whisper recibió el mismo archivo que se almacenó.
  assert.deepEqual(whisper.recibidos[0].bytes, bytesAudio)
  const almacenado = await fetch(`${origen}${relatoConAudio.archivo.url}`)
  assert.deepEqual(Buffer.from(await almacenado.arrayBuffer()), bytesAudio)

  // Resultado de Whisper.
  assert.deepEqual(relatoConAudio.transcripcion, [
    'Mi abuela cantaba bullerengue en la plaza.',
    'Así aprendí el canto de mi gente.',
  ])
  assert.equal(relatoConAudio.duracion, '1:05')
  assert.equal(relatoConAudio.idioma, 'es')
  assert.match(relatoConAudio.fragmento, /^Mi abuela cantaba/)

  // Resultado del clasificador, validado contra las listas permitidas.
  const r = relatoConAudio.revisionIA
  assert.equal(r.fuente, 'ollama:mistral')
  assert.equal(r.tipoSugerido, 'oralitura')
  assert.deepEqual(r.tematicasSugeridas, ['Música y danza', 'Familia'])
  assert.ok(r.sugerencias.some((s) => /sugiere clasificarlo como Oralitura/.test(s)))
  assert.ok(r.confianza < 0.95)
  assert.ok(ollama.ultimaPeticion.format.properties.tipo.enum.includes('musica'))

  // Sigue en la cola, no en el catálogo.
  assert.ok((await jsonRevisor('/revision')).some((x) => x.id === recibido.id))
  assert.ok(!(await json('/relatos')).some((x) => x.id === recibido.id))
})

test('espera a que Whisper termine de cargar el modelo y reintenta', async () => {
  whisper.modo = 'cargando'
  const { id } = await (await conAudio({ titulo: 'Relato con modelo cargando' })).json()
  const relato = await procesado(id)
  assert.equal(relato.procesamiento, 'listo')
  assert.equal(relato.transcripcion.length, 2)
})

test('no se puede aprobar mientras la IA está procesando', async () => {
  whisper.modo = 'lento'
  const { id } = await (await conAudio({ titulo: 'Relato largo' })).json()
  await new Promise((r) => setTimeout(r, 50))

  assert.equal((await json(`/procesamiento/${id}`)).procesamiento, 'transcribiendo')
  const res = await comoRevisor(`/relatos/${id}/aprobar`, { method: 'POST' })
  assert.equal(res.status, 409)

  whisper.liberar()
  assert.equal((await procesado(id)).procesamiento, 'listo')
})

test('si Whisper está apagado queda en error y se puede reprocesar', async () => {
  whisper.modo = 'apagado'
  const { id } = await (await conAudio({ titulo: 'Relato sin Whisper' })).json()
  const conError = await procesado(id)
  assert.equal(conError.procesamiento, 'error')
  assert.match(conError.procesamientoError, /Whisper/)

  whisper.modo = 'ok'
  const res = await comoRevisor(`/relatos/${id}/reprocesar`, { method: 'POST' })
  assert.equal(res.status, 202)
  assert.equal((await procesado(id)).procesamiento, 'listo')
})

test('si Ollama está apagado la clasificación usa solo las reglas', async () => {
  ollama.modo = 'apagado'
  const { id } = await (await conAudio({ titulo: 'Relato sin Ollama' })).json()
  const relato = await procesado(id)
  assert.equal(relato.procesamiento, 'listo')
  assert.equal(relato.revisionIA.fuente, 'reglas')
  assert.equal(relato.transcripcion.length, 2)
})

test('una imagen original no se transcribe ni se ilustra con IA', async () => {
  whisper.recibidos = []
  const res = await api('/relatos', {
    method: 'POST',
    body: formulario(
      { titulo: 'Mural del barrio', tipo: 'obra', descripcion: 'Mural pintado con los vecinos.' },
      { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]), mime: 'image/png', nombre: 'mural.png' }
    ),
  })
  assert.equal(res.status, 202)
  const relato = await procesado((await res.json()).id)
  assert.equal(relato.iaGenerada, false)
  assert.equal(relato.archivo.tipoMedio, 'imagen')
  assert.equal(whisper.recibidos.length, 0)
  assert.deepEqual(relato.transcripcion, ['Mural pintado con los vecinos.'])
  assert.equal(relato.procesamiento, 'listo')
})

// --- Revisión comunitaria ----------------------------------------------------

test('aprobar publica el relato y deja rastro en la bitácora', async () => {
  const res = await comoRevisor(`/relatos/${relatoConAudio.id}/aprobar`, { method: 'POST' })
  assert.equal(res.status, 200)
  const aprobado = await res.json()
  assert.equal(aprobado.estado, 'revisado')
  assert.equal(aprobado.publicado, true)

  assert.ok((await json('/relatos')).some((r) => r.id === relatoConAudio.id))
  assert.equal((await api(`/relatos/${relatoConAudio.id}`)).status, 200)
  // La bitácora deja constancia de quién aprobó.
  assert.match((await jsonRevisor('/actividad'))[0].texto, /Aprobado y publicado por Ana Revisora/)

  const repetido = await comoRevisor(`/relatos/${relatoConAudio.id}/aprobar`, { method: 'POST' })
  assert.equal(repetido.status, 409)
})

test('devolver un relato lo saca de la cola y guarda el motivo', async () => {
  const res = await comoRevisor('/relatos/pend-trampa-pesca/rechazar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo: 'Falta confirmar el nombre del narrador' }),
  })
  assert.equal(res.status, 200)
  const devuelto = await res.json()
  assert.equal(devuelto.estado, 'devuelto')
  assert.equal(devuelto.motivoDevolucion, 'Falta confirmar el nombre del narrador')
  assert.ok(!(await jsonRevisor('/revision')).some((r) => r.id === 'pend-trampa-pesca'))
})

test('las estadísticas reflejan el estado de la base de datos', async () => {
  const stats = await json('/estadisticas')
  assert.equal(stats.publicados, (await json('/relatos')).length)
  assert.equal(stats.pendientes, (await jsonRevisor('/revision')).length)
  assert.equal(stats.devueltos, 1)
  assert.equal(stats.procesando, 0)
  assert.equal(stats.archivos, 6)
})

// --- Cuentas y permisos -------------------------------------------------------

test('las rutas de revisión y de cuentas exigen sesión (401)', async () => {
  assert.equal((await api('/revision')).status, 401)
  assert.equal((await api('/actividad')).status, 401)
  assert.equal((await api('/relatos/pend-arrullo-guapi/aprobar', { method: 'POST' })).status, 401)
  assert.equal((await api('/usuarios')).status, 401)
  assert.equal((await api('/demo/reset', { method: 'POST' })).status, 401)
  // Lo público sigue abierto.
  assert.equal((await api('/relatos')).status, 200)
  assert.equal((await api('/estadisticas')).status, 200)
})

test('ingresar crea una sesión en una cookie HttpOnly y SameSite', async () => {
  const res = await ingresar(cuentas.revisora.correo, cuentas.revisora.clave)
  const cookie = res.headers.get('set-cookie')
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  const { usuario } = await res.json()
  assert.equal(usuario.rol, 'revisor')
  assert.equal(usuario.claveHash, undefined)
  assert.equal(usuario.clave_hash, undefined)

  const sesion = await (await comoRevisor('/auth/sesion')).json()
  assert.equal(sesion.usuario.correo, 'ana@prueba.co')
  assert.equal(sesion.hayCuentas, true)
  assert.equal((await json('/auth/sesion')).usuario, null)
})

test('credenciales incorrectas dan el mismo error, exista o no el correo', async () => {
  const claveMala = await ingresar(cuentas.revisora.correo, 'no-es-la-clave')
  const correoMalo = await ingresar('nadie@prueba.co', 'no-es-la-clave')
  assert.equal(claveMala.status, 401)
  assert.equal(correoMalo.status, 401)
  assert.deepEqual(await claveMala.json(), await correoMalo.json())
})

test('bloquea el ingreso tras 5 intentos fallidos (429)', async () => {
  const intento = () => ingresar('objetivo@prueba.co', 'adivinando-la-clave')
  for (let i = 0; i < 5; i++) assert.equal((await intento()).status, 401)
  const bloqueado = await intento()
  assert.equal(bloqueado.status, 429)
  assert.ok(Number(bloqueado.headers.get('retry-after')) > 0)
})

test('solo un administrador puede crear cuentas', async () => {
  const nueva = { nombre: 'Rosa Cantadora', correo: 'rosa@prueba.co', rol: 'revisor', clave: claveAleatoria() }
  const peticion = (cuenta, datos) =>
    como(cuenta, '/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })

  assert.equal((await como(cuentas.revisora, '/usuarios')).status, 403)
  assert.equal((await peticion(cuentas.revisora, nueva)).status, 403)

  assert.equal((await peticion(cuentas.admin, { ...nueva, clave: 'corta' })).status, 400)
  const creada = await peticion(cuentas.admin, nueva)
  assert.equal(creada.status, 201)
  assert.equal((await creada.json()).rol, 'revisor')
  assert.equal((await peticion(cuentas.admin, nueva)).status, 409)

  const lista = await (await como(cuentas.admin, '/usuarios')).json()
  assert.ok(lista.some((u) => u.correo === 'rosa@prueba.co'))
  assert.ok(lista.every((u) => u.claveHash === undefined && u.clave_hash === undefined))
})

test('desactivar una cuenta cierra sus sesiones e impide el ingreso', async () => {
  const temporal = await crearYEntrar('Cuenta Temporal', 'temporal@prueba.co', 'revisor')
  assert.equal((await como(temporal, '/revision')).status, 200)

  const { id } = repo.usuarioPorCorreo('temporal@prueba.co')
  const res = await como(cuentas.admin, `/usuarios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo: false }),
  })
  assert.equal(res.status, 200)
  assert.equal((await como(temporal, '/revision')).status, 401)
  assert.equal((await ingresar(temporal.correo, temporal.clave)).status, 401)
})

test('un administrador no puede desactivar su propia cuenta', async () => {
  const { id } = repo.usuarioPorCorreo('luis@prueba.co')
  const res = await como(cuentas.admin, `/usuarios/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo: false }),
  })
  assert.equal(res.status, 400)
})

test('cerrar sesión invalida la cookie', async () => {
  const sesion = await crearYEntrar('Cuenta Salida', 'salida@prueba.co', 'revisor')
  assert.equal((await como(sesion, '/revision')).status, 200)
  await como(sesion, '/auth/salir', { method: 'POST' })
  assert.equal((await como(sesion, '/revision')).status, 401)
})
