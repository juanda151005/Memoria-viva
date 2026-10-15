import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { departamentos, tiposPatrimonio, tematicas, epocas } from '../data/mockData.js'
import { formatoBytes } from '../utils/formato.js'

const LIMITE_ARCHIVO = 500 * 1024 * 1024 // debe coincidir con server/app.js

const steps = [
  { id: 'sube', label: 'Subiendo al servidor', icon: '☁️', desc: 'Almacenamiento del archivo original' },
  { id: 'transcribe', label: 'Transcribiendo audio', icon: '📝', desc: 'Modelo tipo Whisper' },
  { id: 'clasifica', label: 'Clasificando en el catálogo', icon: '🗂️', desc: 'Región, tipo y temática' },
  { id: 'ilustra', label: 'Generando ilustración', icon: '🎨', desc: 'Solo si no hay imagen o video' },
  { id: 'listo', label: 'Guardado — listo para revisión', icon: '✅', desc: 'Espera aprobación comunitaria' },
]

const formularioVacio = {
  titulo: '',
  comunidad: '',
  narrador: '',
  departamento: '',
  municipio: '',
  tipo: '',
  epoca: '',
  descripcion: '',
  tematicas: [],
  consentimiento: false,
}

function DropZone({ file, setFile, disabled }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const pick = (f) => {
    if (f) setFile(f)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        if (!disabled) pick(e.dataTransfer.files?.[0])
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`grid place-items-center rounded-xl2 border-2 border-dashed px-6 py-14 text-center transition-colors ${
        disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
      } ${
        drag
          ? 'border-terracota bg-terracota/5'
          : 'border-arenaDark/70 bg-cream hover:border-terracota/60 hover:bg-paper'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="audio/*,video/*,image/*,.pdf,.doc,.docx"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {file ? (
        <div>
          <div className="text-4xl">📄</div>
          <p className="mt-3 font-serif text-lg font-600 text-ink">{file.name}</p>
          <p className="mt-1 text-sm text-ink/60">
            {file.type || 'archivo'} · {formatoBytes(file.size)}
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setFile(null)
              }}
              className="mt-4 text-sm font-medium text-terracota hover:underline"
            >
              Elegir otro archivo
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-selva/10 text-3xl">
            ⬆️
          </div>
          <p className="mt-4 font-serif text-xl font-600 text-ink">Arrastra tu archivo aquí</p>
          <p className="mt-1 text-sm text-ink/60">o haz clic para seleccionarlo</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['🎙️ Audio', '🎬 Video', '📷 Foto', '📄 Documento'].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/45">MP3, WAV, MP4, JPG, PNG, PDF · hasta 500 MB</p>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, required }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label} {required && <span className="text-terracota">*</span>}
      </span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-lg border border-arenaDark/60 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20 disabled:opacity-60'

// Descripción de cada paso según lo que respondió el servidor.
function detallePaso(id, { progreso, file, resultado }) {
  if (id === 'sube') {
    return file
      ? `${Math.round(progreso * 100)}% de ${formatoBytes(file.size)}`
      : 'Sin archivo adjunto: se guardan solo los datos'
  }
  if (!resultado) return null
  const medio = resultado.archivo?.tipoMedio
  if (id === 'transcribe' && !['audio', 'video'].includes(medio)) {
    return 'Sin audio: se usa la descripción escrita'
  }
  if (id === 'clasifica') {
    const conf = Math.round((resultado.revisionIA?.confianza ?? 0) * 100)
    return `Región ${resultado.region} · ${conf}% de confianza`
  }
  if (id === 'ilustra') {
    return resultado.iaGenerada
      ? 'Ilustración propuesta (marcada como IA)'
      : 'Se conserva la imagen o video original'
  }
  if (id === 'listo') return `Código MV-${resultado.id.slice(0, 6).toUpperCase()}`
  return null
}

function Stepper({ current, transcrito, progreso, file, resultado }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        const detalle = (done || active) && detallePaso(s.id, { progreso, file, resultado })
        return (
          <li key={s.id} className="flex items-start gap-4">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg transition-all ${
                done
                  ? 'bg-selva text-cream'
                  : active
                  ? 'animate-pulse bg-terracota text-cream'
                  : 'bg-arena text-ink/50'
              }`}
            >
              {done ? '✓' : s.icon}
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className={`font-semibold ${done || active ? 'text-ink' : 'text-ink/50'}`}>
                {s.label}
                {active && <span className="ml-2 text-xs font-normal text-terracota">procesando…</span>}
              </p>
              <p className="text-xs text-ink/55">{detalle || s.desc}</p>

              {/* Progreso real de la subida */}
              {s.id === 'sube' && active && file && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-arena">
                  <div
                    className="h-full rounded-full bg-terracota transition-[width]"
                    style={{ width: `${Math.round(progreso * 100)}%` }}
                  />
                </div>
              )}

              {/* Transcripción devuelta por el servidor, escrita en vivo */}
              {s.id === 'transcribe' && (active || done) && transcrito && (
                <p className="mt-2 rounded-lg border border-arena bg-paper p-3 font-serif text-xs italic leading-relaxed text-ink/75">
                  “{transcrito}
                  {active && <span className="animate-pulse">▍</span>}”
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function Upload() {
  const { subirRelato } = useStore()

  const [file, setFile] = useState(null)
  const [form, setForm] = useState(formularioVacio)
  const [error, setError] = useState('')

  // fase: 'idle' | 'procesando' | 'listo'
  const [fase, setFase] = useState('idle')
  const [current, setCurrent] = useState(-1)
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [transcrito, setTranscrito] = useState('')

  const ocupado = fase === 'procesando'

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggleTema = (t) =>
    setForm((f) => ({
      ...f,
      tematicas: f.tematicas.includes(t)
        ? f.tematicas.filter((x) => x !== t)
        : [...f.tematicas, t],
    }))

  // Texto que se "escribe" en el paso de transcripción (máx. 60 palabras).
  const palabras = useMemo(() => {
    if (!resultado) return []
    const texto = resultado.transcripcion.join(' ') || 'Sin audio: no hay nada que transcribir.'
    return texto.split(/\s+/).slice(0, 60)
  }, [resultado])

  // Avance de los pasos de IA una vez el servidor respondió.
  useEffect(() => {
    if (fase !== 'procesando' || current < 1) return
    if (current >= steps.length) {
      setFase('listo')
      return
    }
    const espera = current === 1 ? Math.max(1400, palabras.length * 45 + 400) : 1100
    const t = setTimeout(() => setCurrent((c) => c + 1), espera)
    return () => clearTimeout(t)
  }, [fase, current, palabras])

  // Escritura en vivo de la transcripción.
  useEffect(() => {
    if (current !== 1 || !palabras.length) return
    let i = 0
    const iv = setInterval(() => {
      i++
      setTranscrito(palabras.slice(0, i).join(' '))
      if (i >= palabras.length) clearInterval(iv)
    }, 45)
    return () => clearInterval(iv)
  }, [current, palabras])

  const start = async (e) => {
    e.preventDefault()
    const faltantes = ['titulo', 'comunidad', 'narrador', 'departamento', 'municipio', 'tipo']
    if (faltantes.some((k) => !form[k].trim())) {
      setError('Completa los campos obligatorios (*) para procesar el relato.')
      return
    }
    if (!form.consentimiento) {
      setError('Necesitas confirmar el consentimiento comunitario para continuar.')
      return
    }
    if (file && file.size > LIMITE_ARCHIVO) {
      setError('El archivo supera el límite de 500 MB.')
      return
    }

    const datos = new FormData()
    for (const k of ['titulo', 'comunidad', 'narrador', 'departamento', 'municipio', 'tipo', 'epoca', 'descripcion']) {
      datos.append(k, form[k])
    }
    datos.append('tematicas', JSON.stringify(form.tematicas))
    datos.append('consentimiento', String(form.consentimiento))
    if (file) datos.append('archivo', file)

    setError('')
    setResultado(null)
    setTranscrito('')
    setProgreso(0)
    setCurrent(0)
    setFase('procesando')

    try {
      const relato = await subirRelato(datos, setProgreso)
      setProgreso(1)
      setResultado(relato)
      setCurrent(1)
    } catch (err) {
      setError(err.message)
      setFase('idle')
      setCurrent(-1)
    }
  }

  const reset = () => {
    setFase('idle')
    setCurrent(-1)
    setProgreso(0)
    setResultado(null)
    setTranscrito('')
    setFile(null)
    setForm(formularioVacio)
  }

  return (
    <div>
      <section className="border-b border-arena bg-cream paper-grain">
        <div className="container-mv py-12 sm:py-16">
          <span className="eyebrow">Aportar</span>
          <h1 className="mt-3 font-serif text-4xl font-600 text-ink sm:text-5xl">
            Sube un relato de tu comunidad
          </h1>
          <p className="mt-3 max-w-2xl text-ink/70">
            La inteligencia artificial transcribe y organiza automáticamente. Tu comunidad
            revisa y decide qué se publica. Tú siempre conservas la autoría.
          </p>
        </div>
      </section>

      <div className="container-mv py-12">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Formulario */}
          <form onSubmit={start} className="space-y-8">
            <fieldset disabled={ocupado || fase === 'listo'} className="space-y-8">
              <div>
                <h2 className="font-serif text-2xl font-600 text-ink">1. El archivo</h2>
                <p className="mt-1 text-sm text-ink/60">
                  Audio, video, foto o documento con el relato.
                </p>
                <div className="mt-4">
                  <DropZone file={file} setFile={setFile} disabled={ocupado || fase === 'listo'} />
                </div>
              </div>

              <div>
                <h2 className="font-serif text-2xl font-600 text-ink">2. Datos del relato</h2>
                <p className="mt-1 text-sm text-ink/60">
                  La IA propondrá clasificaciones; puedes ajustarlas.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Título del relato" required>
                      <input
                        className={inputCls}
                        maxLength={160}
                        placeholder="Ej. El canto de boga para subir el río"
                        value={form.titulo}
                        onChange={(e) => upd('titulo', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="Comunidad" required>
                    <input
                      className={inputCls}
                      placeholder="Ej. Bogas del Atrato"
                      value={form.comunidad}
                      onChange={(e) => upd('comunidad', e.target.value)}
                    />
                  </Field>

                  <Field label="Narrador / autor" required>
                    <input
                      className={inputCls}
                      placeholder="Nombre de quien narra"
                      value={form.narrador}
                      onChange={(e) => upd('narrador', e.target.value)}
                    />
                  </Field>

                  <Field label="Departamento" required>
                    <select
                      className={inputCls}
                      value={form.departamento}
                      onChange={(e) => upd('departamento', e.target.value)}
                    >
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {departamentos.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Municipio" required>
                    <input
                      className={inputCls}
                      placeholder="Ej. Quibdó"
                      value={form.municipio}
                      onChange={(e) => upd('municipio', e.target.value)}
                    />
                  </Field>

                  <Field label="Tipo de patrimonio" required>
                    <select
                      className={inputCls}
                      value={form.tipo}
                      onChange={(e) => upd('tipo', e.target.value)}
                    >
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {tiposPatrimonio.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.icon} {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Época">
                    <select
                      className={inputCls}
                      value={form.epoca}
                      onChange={(e) => upd('epoca', e.target.value)}
                    >
                      <option value="" disabled>
                        Selecciona…
                      </option>
                      {epocas.map((ep) => (
                        <option key={ep}>{ep}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Temáticas">
                      <div className="flex flex-wrap gap-2">
                        {tematicas.map((t) => {
                          const on = form.tematicas.includes(t)
                          return (
                            <button
                              type="button"
                              key={t}
                              onClick={() => toggleTema(t)}
                              aria-pressed={on}
                              className={`chip cursor-pointer select-none transition ${
                                on
                                  ? '!border-terracota !bg-terracota/10 !text-terracota'
                                  : 'hover:border-terracota'
                              }`}
                            >
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Descripción / contexto">
                      <textarea
                        rows={3}
                        className={inputCls}
                        placeholder="¿En qué contexto se narra? ¿Qué significa para la comunidad?"
                        value={form.descripcion}
                        onChange={(e) => upd('descripcion', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Consentimiento */}
              <div className="card border-anil/30 bg-anil/5 p-5">
                <label className="flex items-start gap-3 text-sm text-ink/80">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-terracota"
                    checked={form.consentimiento}
                    onChange={(e) => upd('consentimiento', e.target.checked)}
                  />
                  <span>
                    Cuento con el <strong>consentimiento de la persona narradora</strong> y de
                    la comunidad para registrar y compartir este relato, y entiendo que se
                    publicará solo tras la revisión comunitaria.
                  </span>
                </label>
              </div>
            </fieldset>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-terracota/40 bg-terracota/5 px-4 py-3 text-sm font-medium text-terracota"
              >
                {error}
              </p>
            )}

            {fase !== 'listo' && (
              <button
                type="submit"
                disabled={ocupado}
                className="btn-primary w-full disabled:opacity-60 sm:w-auto"
              >
                {ocupado ? 'Procesando…' : 'Procesar con IA'}
              </button>
            )}
          </form>

          {/* Panel de procesamiento */}
          <aside>
            <div className="card p-6 lg:sticky lg:top-24">
              <h2 className="font-serif text-xl font-600 text-ink">Procesamiento con IA</h2>
              <p className="mt-1 text-sm text-ink/60">
                {fase === 'idle'
                  ? 'Cuando envíes el relato, verás aquí el avance.'
                  : 'Así transforma la plataforma tu archivo:'}
              </p>

              <div className="mt-6">
                <Stepper
                  current={current}
                  transcrito={transcrito}
                  progreso={progreso}
                  file={file}
                  resultado={resultado}
                />
              </div>

              {fase === 'listo' && (
                <div className="mt-6 rounded-xl bg-selva/10 p-4 text-center">
                  <div className="text-3xl">🎉</div>
                  <p className="mt-2 font-serif text-lg font-600 text-selva">
                    ¡Guardado y enviado a revisión!
                  </p>
                  <p className="mt-1 text-xs text-ink/65">
                    El relato quedó en la base de datos, en la cola de revisión. Una persona
                    de la comunidad lo revisará antes de publicarlo.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link to="/revision" className="btn-selva !px-4 !py-2">
                      Ver panel de revisión →
                    </Link>
                    <button onClick={reset} className="btn-ghost !px-4 !py-2">
                      Subir otro
                    </button>
                  </div>
                </div>
              )}

              {fase === 'idle' && (
                <p className="mt-6 text-xs text-ink/45">
                  El archivo y los datos se guardan en el servidor. La transcripción,
                  clasificación e ilustración aún son simuladas: la integración con modelos
                  reales es la siguiente fase.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
