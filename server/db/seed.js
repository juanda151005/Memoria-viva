import { relatos, relatosPendientesSeed } from '../../src/data/mockData.js'
import { createRepo } from '../repositorio.js'
import { clasificarConReglas } from '../services/ia.js'
import { tx } from './database.js'

// Carga los relatos de ejemplo. Los revisados quedan publicados; los que
// están "en revisión" entran a la cola: nada se publica sin aprobación.
export function seed(db) {
  const repo = createRepo(db)
  const ahora = new Date().toISOString()

  tx(db, () => {
    for (const r of [...relatos, ...relatosPendientesSeed]) {
      const publicado = r.estado === 'revisado'
      repo.crearRelato({
        ...r,
        publicado,
        publicadoEn: publicado ? ahora : null,
        consentimiento: true,
        revisionIA: r.revisionIA ?? clasificarConReglas(r).revisionIA,
        creadoEn: ahora,
      })
    }
  })
}

export function seedIfEmpty(db) {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM relatos').get()
  if (n === 0) seed(db)
}
