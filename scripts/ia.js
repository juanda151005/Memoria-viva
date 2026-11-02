// ============================================================================
// Instala y arranca el servicio local de transcripción (Python + Whisper).
//   node scripts/ia.js instalar   -> crea ia-service/.venv e instala dependencias
//   node scripts/ia.js iniciar    -> arranca el servicio en http://127.0.0.1:8001
// ============================================================================
import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dirServicio = path.join(raiz, 'ia-service')
const venv = path.join(dirServicio, '.venv')
const esWindows = process.platform === 'win32'
const pythonVenv = esWindows
  ? path.join(venv, 'Scripts', 'python.exe')
  : path.join(venv, 'bin', 'python')

// faster-whisper depende de paquetes que aún no publican versiones para todos
// los Python recientes; se prefiere 3.12 o 3.11.
function pythonDelSistema() {
  const candidatos = esWindows
    ? [['py', ['-3.12']], ['py', ['-3.11']], ['python', []]]
    : [['python3.12', []], ['python3.11', []], ['python3', []]]
  for (const [cmd, args] of candidatos) {
    const r = spawnSync(cmd, [...args, '--version'], { encoding: 'utf8' })
    if (r.status === 0) return [cmd, args]
  }
  return null
}

function ejecutar(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function instalar() {
  if (!fs.existsSync(pythonVenv)) {
    const python = pythonDelSistema()
    if (!python) {
      console.error('No se encontró Python 3.11 o 3.12. Instálalo desde https://www.python.org/')
      process.exit(1)
    }
    console.log('Creando entorno virtual en ia-service/.venv …')
    ejecutar(python[0], [...python[1], '-m', 'venv', venv])
  }
  console.log('Instalando dependencias (faster-whisper, FastAPI) …')
  ejecutar(pythonVenv, ['-m', 'pip', 'install', '--upgrade', 'pip', '--quiet'])
  ejecutar(pythonVenv, ['-m', 'pip', 'install', '-r', path.join(dirServicio, 'requirements.txt')])
  console.log('\nListo. El modelo de Whisper se descarga la primera vez que arranca el servicio.')
}

function iniciar() {
  if (!fs.existsSync(pythonVenv)) {
    console.log(
      '⚠ El servicio de transcripción no está instalado. Ejecuta: npm run ia:instalar\n' +
        '  La app funciona igual, pero los audios quedarán sin transcribir.'
    )
    return
  }
  const hijo = spawn(pythonVenv, [path.join(dirServicio, 'main.py')], { stdio: 'inherit' })
  hijo.on('exit', (code) => process.exit(code ?? 0))
  for (const senal of ['SIGINT', 'SIGTERM']) process.on(senal, () => hijo.kill(senal))
}

const comando = process.argv[2]
if (comando === 'instalar') instalar()
else if (comando === 'iniciar') iniciar()
else {
  console.error('Uso: node scripts/ia.js <instalar|iniciar>')
  process.exit(1)
}
