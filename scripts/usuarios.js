// ============================================================================
// Gestión de cuentas desde la terminal (útil para crear la primera cuenta).
//
//   npm run usuario:crear -- --nombre "Ana Mosquera" --correo ana@correo.com --rol admin
//   npm run usuarios -- listar
//   npm run usuarios -- desactivar --correo ana@correo.com
//   npm run usuarios -- activar --correo ana@correo.com
//   npm run usuarios -- eliminar --correo ana@correo.com
//
// La contraseña se pide sin mostrarla en pantalla. Para scripts se puede pasar
// con la variable de entorno MV_CLAVE (nunca como argumento, quedaría en el
// historial de la terminal).
// ============================================================================
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { openDb } from '../server/db/database.js'
import { createRepo } from '../server/repositorio.js'
import { crearCuenta, LARGO_MINIMO_CLAVE, validarCuenta } from '../server/auth.js'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const db = openDb(process.env.DB_PATH ?? path.join(raiz, 'server', 'data', 'memoria-viva.db'))
const repo = createRepo(db)

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    nombre: { type: 'string' },
    correo: { type: 'string' },
    rol: { type: 'string', default: 'revisor' },
  },
})

function salir(mensaje, codigo = 1) {
  console.error(mensaje)
  process.exit(codigo)
}

// Pide un texto sin mostrar lo que se escribe.
function preguntarOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (texto) => {
      if (texto.includes(pregunta)) process.stdout.write(texto)
    }
    rl.question(pregunta, (respuesta) => {
      rl.close()
      process.stdout.write('\n')
      resolve(respuesta)
    })
  })
}

async function leerClave() {
  if (process.env.MV_CLAVE) return process.env.MV_CLAVE
  if (!process.stdin.isTTY) salir('No hay terminal interactiva: define la contraseña en MV_CLAVE.')
  const clave = await preguntarOculto(`Contraseña (mínimo ${LARGO_MINIMO_CLAVE} caracteres): `)
  const repetida = await preguntarOculto('Repite la contraseña: ')
  if (clave !== repetida) salir('Las contraseñas no coinciden.')
  return clave
}

function buscar(correo) {
  if (!correo) salir('Falta --correo')
  const usuario = repo.usuarioPorCorreo(correo)
  if (!usuario) salir(`No existe una cuenta con el correo ${correo}`)
  return usuario
}

const comando = positionals[0]

if (comando === 'crear') {
  const { nombre, correo, rol } = values
  const errorPrevio = validarCuenta({ nombre, correo, rol, clave: 'x'.repeat(LARGO_MINIMO_CLAVE) })
  if (errorPrevio) salir(errorPrevio)
  if (repo.usuarioPorCorreo(correo)) salir(`Ya existe una cuenta con el correo ${correo}`)
  const clave = await leerClave()
  const error = validarCuenta({ nombre, correo, rol, clave })
  if (error) salir(error)
  const usuario = await crearCuenta(repo, { nombre, correo, rol, clave })
  console.log(`✓ Cuenta creada: ${usuario.nombre} <${usuario.correo}> · rol ${usuario.rol}`)
} else if (comando === 'listar') {
  const usuarios = repo.listarUsuarios()
  if (!usuarios.length) console.log('No hay cuentas.')
  for (const u of usuarios) {
    console.log(`${u.activo ? '●' : '○'} ${u.nombre} <${u.correo}> · ${u.rol}${u.activo ? '' : ' (inactiva)'}`)
  }
} else if (comando === 'activar' || comando === 'desactivar') {
  const usuario = buscar(values.correo)
  repo.cambiarActivo(usuario.id, comando === 'activar')
  console.log(`✓ Cuenta ${comando === 'activar' ? 'activada' : 'desactivada'}: ${usuario.correo}`)
} else if (comando === 'eliminar') {
  const usuario = buscar(values.correo)
  repo.eliminarUsuario(usuario.id)
  console.log(`✓ Cuenta eliminada: ${usuario.correo}`)
} else {
  salir('Uso: node scripts/usuarios.js <crear|listar|activar|desactivar|eliminar> [--nombre] [--correo] [--rol]')
}
