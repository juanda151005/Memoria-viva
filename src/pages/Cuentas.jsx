import { useState } from 'react'
import ErrorBanner from '../components/ErrorBanner.jsx'
import { api } from '../api/client.js'
import { useApi } from '../hooks/useApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatoFecha } from '../utils/formato.js'

const LARGO_MINIMO_CLAVE = 10 // debe coincidir con server/auth.js

const inputCls =
  'w-full rounded-lg border border-arenaDark/60 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20'

const ETIQUETA_ROL = {
  admin: 'Administración',
  revisor: 'Revisión',
}

// Contraseña temporal aleatoria (14 caracteres, sin caracteres ambiguos).
function generarClave() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const valores = crypto.getRandomValues(new Uint32Array(14))
  return Array.from(valores, (v) => alfabeto[v % alfabeto.length]).join('')
}

const vacia = { nombre: '', correo: '', rol: 'revisor', clave: '' }

function NuevaCuenta({ onCreada }) {
  const [datos, setDatos] = useState(vacia)
  const [verClave, setVerClave] = useState(false)
  const [error, setError] = useState('')
  const [creada, setCreada] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const upd = (k, v) => setDatos((d) => ({ ...d, [k]: v }))

  const enviar = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const usuario = await api.crearUsuario(datos)
      setCreada(usuario)
      setDatos(vacia)
      setVerClave(false)
      onCreada()
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl font-600 text-ink">Nueva cuenta</h2>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Nombre</span>
        <input required maxLength={80} value={datos.nombre} onChange={(e) => upd('nombre', e.target.value)} className={inputCls} />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Correo</span>
        <input
          type="email"
          required
          autoComplete="off"
          value={datos.correo}
          onChange={(e) => upd('correo', e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Rol</span>
        <select value={datos.rol} onChange={(e) => upd('rol', e.target.value)} className={inputCls}>
          <option value="revisor">Revisión — aprueba y devuelve relatos</option>
          <option value="admin">Administración — además gestiona cuentas</option>
        </select>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink">Contraseña temporal</span>
        <div className="flex gap-2">
          <input
            type={verClave ? 'text' : 'password'}
            required
            minLength={LARGO_MINIMO_CLAVE}
            autoComplete="new-password"
            value={datos.clave}
            onChange={(e) => upd('clave', e.target.value)}
            className={`${inputCls} font-mono`}
          />
          <button
            type="button"
            onClick={() => {
              upd('clave', generarClave())
              setVerClave(true)
            }}
            className="btn-ghost shrink-0 !px-3 !py-2 text-xs"
          >
            Generar
          </button>
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Mínimo {LARGO_MINIMO_CLAVE} caracteres. Compártela por un canal privado.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-terracota/40 bg-terracota/5 px-3 py-2 text-sm text-terracota">
          {error}
        </p>
      )}
      {creada && (
        <p role="status" className="rounded-lg bg-selva/10 px-3 py-2 text-sm text-selva">
          ✓ Cuenta creada para <strong>{creada.nombre}</strong>.
        </p>
      )}

      <button type="submit" disabled={enviando} className="btn-primary w-full disabled:opacity-60">
        {enviando ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}

export default function Cuentas() {
  const { usuario: yo } = useAuth()
  const [intento, setIntento] = useState(0)
  const { data: usuarios, loading, error } = useApi(() => api.usuarios(), [intento])
  const [errorAccion, setErrorAccion] = useState('')
  const recargar = () => setIntento((n) => n + 1)

  const alternar = async (u) => {
    setErrorAccion('')
    try {
      await api.cambiarActivo(u.id, !u.activo)
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    }
  }

  return (
    <div>
      <section className="border-b border-arena bg-cream paper-grain">
        <div className="container-mv py-12 sm:py-16">
          <span className="eyebrow">Administración</span>
          <h1 className="mt-3 font-serif text-4xl font-600 text-ink sm:text-5xl">Cuentas</h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            Personas que pueden revisar y publicar relatos. Desactivar una cuenta cierra sus
            sesiones de inmediato; su historial de revisiones se conserva.
          </p>
        </div>
      </section>

      <div className="container-mv py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <ErrorBanner error={error} onReintentar={recargar} className="mb-4" />
            {errorAccion && (
              <p role="alert" className="mb-4 rounded-lg border border-terracota/40 bg-terracota/5 px-3 py-2 text-sm text-terracota">
                {errorAccion}
              </p>
            )}

            <div className="card divide-y divide-arena/70">
              {loading && !usuarios ? (
                <p className="p-6 text-sm text-ink/50">Cargando cuentas…</p>
              ) : (
                (usuarios ?? []).map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold ${
                        u.activo ? 'bg-selva text-cream' : 'bg-arena text-ink/50'
                      }`}
                    >
                      {u.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${u.activo ? 'text-ink' : 'text-ink/50 line-through'}`}>
                        {u.nombre}
                        {u.id === yo.id && <span className="ml-2 text-xs font-normal text-ink/50">(tú)</span>}
                      </p>
                      <p className="truncate text-xs text-ink/55">{u.correo}</p>
                    </div>
                    <span className={`chip ${u.rol === 'admin' ? '!border-anil/40 !text-anil' : ''}`}>
                      {ETIQUETA_ROL[u.rol]}
                    </span>
                    <span className="w-36 text-xs text-ink/50">
                      {u.ultimoIngreso ? `Último ingreso: ${formatoFecha(u.ultimoIngreso)}` : 'Nunca ha ingresado'}
                    </span>
                    {u.id !== yo.id && (
                      <button
                        onClick={() => alternar(u)}
                        className={`text-sm font-semibold hover:underline ${u.activo ? 'text-terracota' : 'text-selva'}`}
                      >
                        {u.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <aside>
            <div className="lg:sticky lg:top-24">
              <NuevaCuenta onCreada={recargar} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
