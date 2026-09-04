import { useState, useEffect, useRef } from 'react'
import {
  departamentos,
  tiposPatrimonio,
  tematicas,
  epocas,
} from '../data/mockData.js'

const steps = [
  { id: 'transcribe', label: 'Transcribiendo audio', icon: '📝', desc: 'Modelo tipo Whisper' },
  { id: 'clasifica', label: 'Clasificando en el catálogo', icon: '🗂️', desc: 'Región, tipo y temática' },
  { id: 'ilustra', label: 'Generando ilustración', icon: '🎨', desc: 'Solo si no hay imagen' },
  { id: 'listo', label: 'Listo para revisión', icon: '✅', desc: 'Espera aprobación comunitaria' },
]

function DropZone({ file, setFile }) {
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const pick = (f) => {
    if (f) setFile({ name: f.name, size: f.size, type: f.type })
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDrag(true)
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        pick(e.dataTransfer.files?.[0])
      }}
      onClick={() => inputRef.current?.click()}
      className={`grid cursor-pointer place-items-center rounded-xl2 border-2 border-dashed px-6 py-14 text-center transition-colors ${
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
            {file.type || 'archivo'} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setFile(null)
            }}
            className="mt-4 text-sm font-medium text-terracota hover:underline"
          >
            Elegir otro archivo
          </button>
        </div>
      ) : (
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-selva/10 text-3xl">
            ⬆️
          </div>
          <p className="mt-4 font-serif text-xl font-600 text-ink">
            Arrastra tu archivo aquí
          </p>
          <p className="mt-1 text-sm text-ink/60">
            o haz clic para seleccionarlo
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['🎙️ Audio', '🎬 Video', '📷 Foto', '📄 Documento'].map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/45">
            MP3, WAV, MP4, JPG, PNG, PDF · hasta 500 MB
          </p>
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
  'w-full rounded-lg border border-arenaDark/60 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder-ink/40 focus:border-terracota focus:outline-none focus:ring-2 focus:ring-terracota/20'

function Stepper({ current }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className="flex items-start gap-4">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-lg transition-all ${
                done
                  ? 'bg-selva text-cream'
                  : active
                  ? 'bg-terracota text-cream animate-pulse'
                  : 'bg-arena text-ink/50'
              }`}
            >
              {done ? '✓' : s.icon}
            </div>
            <div className="flex-1 pt-1">
              <p
                className={`font-semibold ${
                  done || active ? 'text-ink' : 'text-ink/50'
                }`}
              >
                {s.label}
                {active && (
                  <span className="ml-2 text-xs font-normal text-terracota">
                    procesando…
                  </span>
                )}
              </p>
              <p className="text-xs text-ink/55">{s.desc}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function Upload() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!processing) return
    if (current >= steps.length) return
    const t = setTimeout(() => setCurrent((c) => c + 1), 1400)
    return () => clearTimeout(t)
  }, [processing, current])

  const finished = processing && current >= steps.length

  const start = (e) => {
    e.preventDefault()
    setCurrent(0)
    setProcessing(true)
  }

  const reset = () => {
    setProcessing(false)
    setCurrent(0)
    setFile(null)
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
            La inteligencia artificial transcribe y organiza automáticamente. Tu
            comunidad revisa y decide qué se publica. Tú siempre conservas la
            autoría.
          </p>
        </div>
      </section>

      <div className="container-mv py-12">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Formulario */}
          <form onSubmit={start} className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-600 text-ink">
                1. El archivo
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                Audio, video, foto o documento con el relato.
              </p>
              <div className="mt-4">
                <DropZone file={file} setFile={setFile} />
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-600 text-ink">
                2. Datos del relato
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                La IA propondrá clasificaciones; puedes ajustarlas.
              </p>

              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Título del relato" required>
                    <input
                      className={inputCls}
                      placeholder="Ej. El canto de boga para subir el río"
                    />
                  </Field>
                </div>

                <Field label="Comunidad" required>
                  <input className={inputCls} placeholder="Ej. Bogas del Atrato" />
                </Field>

                <Field label="Narrador / autor" required>
                  <input className={inputCls} placeholder="Nombre de quien narra" />
                </Field>

                <Field label="Departamento" required>
                  <select className={inputCls} defaultValue="">
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {departamentos.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Municipio" required>
                  <input className={inputCls} placeholder="Ej. Quibdó" />
                </Field>

                <Field label="Tipo de patrimonio" required>
                  <select className={inputCls} defaultValue="">
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
                  <select className={inputCls} defaultValue="">
                    <option value="" disabled>
                      Selecciona…
                    </option>
                    {epocas.map((e) => (
                      <option key={e}>{e}</option>
                    ))}
                  </select>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Temáticas">
                    <div className="flex flex-wrap gap-2">
                      {tematicas.map((t) => (
                        <label
                          key={t}
                          className="chip cursor-pointer select-none hover:border-terracota has-[:checked]:border-terracota has-[:checked]:bg-terracota/10 has-[:checked]:text-terracota"
                        >
                          <input type="checkbox" className="hidden" />
                          {t}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Descripción / contexto">
                    <textarea
                      rows={3}
                      className={inputCls}
                      placeholder="¿En qué contexto se narra? ¿Qué significa para la comunidad?"
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Consentimiento */}
            <div className="card border-anil/30 bg-anil/5 p-5">
              <label className="flex items-start gap-3 text-sm text-ink/80">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-terracota" />
                <span>
                  Cuento con el <strong>consentimiento de la persona narradora</strong> y de
                  la comunidad para registrar y compartir este relato, y entiendo
                  que se publicará solo tras la revisión comunitaria.
                </span>
              </label>
            </div>

            <button type="submit" className="btn-primary w-full sm:w-auto">
              Procesar con IA
            </button>
          </form>

          {/* Panel de procesamiento */}
          <aside>
            <div className="lg:sticky lg:top-24 card p-6">
              <h2 className="font-serif text-xl font-600 text-ink">
                Procesamiento con IA
              </h2>
              <p className="mt-1 text-sm text-ink/60">
                {processing
                  ? 'Así transforma la IA tu archivo:'
                  : 'Cuando envíes el archivo, verás aquí el avance.'}
              </p>

              <div className="mt-6">
                <Stepper current={processing ? current : -1} />
              </div>

              {finished && (
                <div className="mt-6 rounded-xl bg-selva/10 p-4 text-center">
                  <div className="text-3xl">🎉</div>
                  <p className="mt-2 font-serif text-lg font-600 text-selva">
                    ¡Enviado para revisión!
                  </p>
                  <p className="mt-1 text-xs text-ink/65">
                    Tu relato quedó en cola. Una persona de la comunidad lo
                    revisará antes de publicarlo.
                  </p>
                  <button onClick={reset} className="btn-ghost mt-4 !py-2 !px-4">
                    Subir otro
                  </button>
                </div>
              )}

              {!processing && (
                <p className="mt-6 text-xs text-ink/45">
                  Demostración visual — en el prototipo no se procesan ni
                  almacenan archivos reales.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
