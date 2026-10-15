import GeneratedArt from './GeneratedArt.jsx'

// Muestra el registro visual original (foto o video) cuando existe; si no,
// la ilustración generada por IA. Es la regla central del proyecto.
export default function RelatoMedia({ relato, className = '', controls = false }) {
  const archivo = relato.archivo

  if (archivo?.tipoMedio === 'imagen') {
    return (
      <img
        src={archivo.url}
        alt={`Registro original: ${relato.titulo}`}
        loading="lazy"
        className={`object-cover ${className}`}
      />
    )
  }

  if (archivo?.tipoMedio === 'video') {
    return (
      <video
        src={archivo.url}
        controls={controls}
        muted={!controls}
        playsInline
        preload="metadata"
        className={`bg-ink object-cover ${className}`}
      />
    )
  }

  return <GeneratedArt seed={relato.id} palette={relato.palette} className={className} />
}
