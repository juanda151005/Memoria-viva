import { createHash, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// ============================================================================
// Autenticación de revisores y administradores.
//  - Contraseñas: scrypt con sal aleatoria (nunca se guardan en claro).
//  - Sesión: token aleatorio en una cookie HttpOnly + SameSite=Lax; en la base
//    de datos solo queda su hash, así un robo de la BD no sirve para entrar.
//  - Fuerza bruta: 5 intentos fallidos por correo y dirección bloquean 15 min.
// ============================================================================

const scrypt = promisify(scryptCb)

export const ROLES = ['revisor', 'admin']
export const LARGO_MINIMO_CLAVE = 10

const COOKIE = 'mv_sesion'
const DURACION_SESION_MS = 8 * 60 * 60 * 1000 // una jornada de revisión
const MAX_FALLOS = 5
const VENTANA_FALLOS_MS = 15 * 60 * 1000
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function hashClave(clave) {
  const sal = randomBytes(16)
  const hash = await scrypt(clave, sal, 64)
  return `scrypt$${sal.toString('base64')}$${hash.toString('base64')}`
}

export async function verificarClave(clave, guardado) {
  const [algoritmo, sal, hash] = String(guardado).split('$')
  if (algoritmo !== 'scrypt' || !sal || !hash) return false
  const esperado = Buffer.from(hash, 'base64')
  const calculado = await scrypt(clave, Buffer.from(sal, 'base64'), esperado.length)
  return timingSafeEqual(esperado, calculado)
}

// Hash de relleno: si el correo no existe se verifica contra él igualmente, para
// que el tiempo de respuesta no revele qué correos tienen cuenta.
const hashDeRelleno = hashClave(randomBytes(16).toString('hex'))

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

function leerCookie(req, nombre) {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [clave, ...valor] = parte.trim().split('=')
    if (clave === nombre) return decodeURIComponent(valor.join('='))
  }
  return null
}

const texto = (v) => (typeof v === 'string' ? v.trim() : '')

// Valida los datos de una cuenta nueva; devuelve el primer error o null.
export function validarCuenta({ nombre, correo, rol, clave }) {
  if (!texto(nombre) || texto(nombre).length > 80) return 'El nombre es obligatorio (máx. 80 caracteres)'
  if (!CORREO_VALIDO.test(texto(correo))) return 'El correo no es válido'
  if (!ROLES.includes(rol)) return `El rol debe ser: ${ROLES.join(' o ')}`
  if (typeof clave !== 'string' || clave.length < LARGO_MINIMO_CLAVE) {
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres`
  }
  return null
}

export async function crearCuenta(repo, { nombre, correo, rol, clave }) {
  return repo.crearUsuario({
    id: randomUUID(),
    nombre: texto(nombre),
    correo: texto(correo),
    claveHash: await hashClave(clave),
    rol,
  })
}

export function crearAuth({ repo, cookieSegura = false }) {
  const fallos = new Map()

  const cookie = (valor, maxAgeSeg) =>
    [
      `${COOKIE}=${valor}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${maxAgeSeg}`,
      cookieSegura && 'Secure',
    ]
      .filter(Boolean)
      .join('; ')

  // Middleware: deja en req.usuario a quien tiene una sesión válida (o null).
  function cargarSesion(req, res, next) {
    const token = leerCookie(req, COOKIE)
    req.usuario = token ? repo.usuarioDeSesion(hashToken(token)) : null
    next()
  }

  const requiereRol =
    (...roles) =>
    (req, res, next) => {
      if (!req.usuario) return res.status(401).json({ error: 'Debes iniciar sesión' })
      if (!roles.includes(req.usuario.rol)) {
        return res.status(403).json({ error: 'No tienes permiso para esta acción' })
      }
      next()
    }

  async function iniciarSesion(req, res) {
    const correo = texto(req.body?.correo).toLowerCase()
    const clave = typeof req.body?.clave === 'string' ? req.body.clave : ''
    const llave = `${req.ip}|${correo}`

    const registro = fallos.get(llave)
    if (registro && Date.now() - registro.desde > VENTANA_FALLOS_MS) fallos.delete(llave)
    else if (registro?.n >= MAX_FALLOS) {
      const espera = Math.ceil((registro.desde + VENTANA_FALLOS_MS - Date.now()) / 1000)
      res.setHeader('Retry-After', String(espera))
      return res
        .status(429)
        .json({ error: 'Demasiados intentos fallidos. Espera unos minutos y vuelve a intentarlo.' })
    }

    const usuario = repo.usuarioConClave(correo)
    const claveCorrecta = await verificarClave(clave, usuario?.clave_hash ?? (await hashDeRelleno))
    if (!usuario || !claveCorrecta || usuario.activo !== 1) {
      const actual = fallos.get(llave) ?? { n: 0, desde: Date.now() }
      fallos.set(llave, { ...actual, n: actual.n + 1 })
      // Mismo mensaje en todos los casos: no se revela si el correo existe.
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
    }

    fallos.delete(llave)
    const token = randomBytes(32).toString('base64url')
    repo.crearSesion({ id: hashToken(token), usuarioId: usuario.id, duracionMs: DURACION_SESION_MS })
    repo.registrarIngreso(usuario.id)
    res.setHeader('Set-Cookie', cookie(token, DURACION_SESION_MS / 1000))
    res.json({ usuario: repo.usuarioPorId(usuario.id) })
  }

  function cerrarSesion(req, res) {
    const token = leerCookie(req, COOKIE)
    if (token) repo.eliminarSesion(hashToken(token))
    res.setHeader('Set-Cookie', cookie('', 0))
    res.json({ ok: true })
  }

  return { cargarSesion, requiereRol, iniciarSesion, cerrarSesion }
}
