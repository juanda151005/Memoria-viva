import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { openDb } from '../db/database.js'
import { seed } from '../db/seed.js'
import { createApp } from '../app.js'

// Pruebas de integración de la API: cada corrida usa una base de datos en
// memoria y una carpeta temporal, sin tocar los datos reales.

let server
let origen
let tmp

const api = (ruta, opciones) => fetch(`${origen}/api${ruta}`, opciones)
const json = async (ruta, opciones) => (await api(ruta, opciones)).json()

function formulario(campos = {}, archivo) {
  const fd = new FormData()
  const base = {
    titulo: 'El canto de la ballena en Bahía Solano',
    comunidad: 'Pescadores de Bahía Solano',
    narrador: 'Ana Mosquera',
    departamento: 'Chocó',
    municipio: 'Bahía Solano',
    tipo: 'musica',
    epoca: 'Después de 2000',
    tematicas: JSON.stringify(['Naturaleza', 'Territorio']),
    consentimiento: 'true',
    ...campos,
  }
  for (const [k, v] of Object.entries(base)) if (v !== undefined) fd.append(k, v)
  if (archivo) fd.append('archivo', new Blob([archivo.bytes], { type: archivo.mime }), archivo.nombre)
  return fd
}

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'memoria-viva-test-'))
  const db = openDb(':memory:')
  seed(db)
  const app = createApp({ db, uploadsDir: path.join(tmp, 'uploads') })
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })
  origen = `http://127.0.0.1:${server.address().port}`
})

after(() => {
  server.closeAllConnections()
  server.close()
  fs.rmSync(tmp, { recursive: true, force: true })
})

test('GET /api/salud responde ok', async () => {
  const salud = await json('/salud')
  assert.equal(salud.ok, true)
  assert.ok(salud.relatos > 0)
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
  const res = await api('/relatos/pend-arrullo-guapi')
  assert.equal(res.status, 404)
})

test('rechaza registros sin consentimiento comunitario (400)', async () => {
  const res = await api('/relatos', {
    method: 'POST',
    body: formulario({ consentimiento: undefined }),
  })
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

let relatoConAudio
const bytesAudio = Buffer.from('ID3 grabación de prueba — Memoria Viva')

test('registra un relato con audio, lo almacena y lo envía a revisión', async () => {
  const res = await api('/relatos', {
    method: 'POST',
    body: formulario({}, { bytes: bytesAudio, mime: 'audio/mpeg', nombre: 'canción ñandú.mp3' }),
  })
  assert.equal(res.status, 201)
  relatoConAudio = await res.json()

  assert.equal(relatoConAudio.estado, 'en_revision')
  assert.equal(relatoConAudio.publicado, false)
  assert.equal(relatoConAudio.region, 'Pacífico')
  assert.equal(relatoConAudio.iaGenerada, true)
  assert.ok(relatoConAudio.transcripcion.length > 0)
  assert.equal(relatoConAudio.archivo.tipoMedio, 'audio')
  assert.equal(relatoConAudio.archivo.nombre, 'canción ñandú.mp3')

  // El archivo almacenado se puede recuperar byte a byte.
  const archivo = await fetch(`${origen}${relatoConAudio.archivo.url}`)
  assert.equal(archivo.status, 200)
  assert.equal(archivo.headers.get('content-type'), 'audio/mpeg')
  assert.deepEqual(Buffer.from(await archivo.arrayBuffer()), bytesAudio)

  // Queda en la cola, no en el catálogo.
  assert.ok((await json('/revision')).some((r) => r.id === relatoConAudio.id))
  assert.ok(!(await json('/relatos')).some((r) => r.id === relatoConAudio.id))
})

test('una imagen original evita la ilustración generada por IA', async () => {
  const res = await api('/relatos', {
    method: 'POST',
    body: formulario(
      { titulo: 'Mural del barrio', tipo: 'obra' },
      { bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]), mime: 'image/png', nombre: 'mural.png' }
    ),
  })
  assert.equal(res.status, 201)
  const relato = await res.json()
  assert.equal(relato.iaGenerada, false)
  assert.equal(relato.archivo.tipoMedio, 'imagen')
})

test('aprobar publica el relato y deja rastro en la bitácora', async () => {
  const res = await api(`/relatos/${relatoConAudio.id}/aprobar`, { method: 'POST' })
  assert.equal(res.status, 200)
  const aprobado = await res.json()
  assert.equal(aprobado.estado, 'revisado')
  assert.equal(aprobado.publicado, true)

  assert.ok((await json('/relatos')).some((r) => r.id === relatoConAudio.id))
  assert.equal((await api(`/relatos/${relatoConAudio.id}`)).status, 200)

  const actividad = await json('/actividad')
  assert.match(actividad[0].texto, /Aprobado y publicado/)

  // No se puede aprobar dos veces.
  const repetido = await api(`/relatos/${relatoConAudio.id}/aprobar`, { method: 'POST' })
  assert.equal(repetido.status, 409)
})

test('devolver un relato lo saca de la cola y guarda el motivo', async () => {
  const res = await api('/relatos/pend-trampa-pesca/rechazar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo: 'Falta confirmar el nombre del narrador' }),
  })
  assert.equal(res.status, 200)
  const devuelto = await res.json()
  assert.equal(devuelto.estado, 'devuelto')
  assert.equal(devuelto.motivoDevolucion, 'Falta confirmar el nombre del narrador')
  assert.ok(!(await json('/revision')).some((r) => r.id === 'pend-trampa-pesca'))
})

test('las estadísticas reflejan el estado de la base de datos', async () => {
  const stats = await json('/estadisticas')
  assert.equal(stats.publicados, (await json('/relatos')).length)
  assert.equal(stats.pendientes, (await json('/revision')).length)
  assert.equal(stats.devueltos, 1)
  assert.equal(stats.archivos, 2)
  assert.equal(stats.bytes, bytesAudio.length + 4)
})
