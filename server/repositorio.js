// ============================================================================
// Repositorio — único lugar donde vive el SQL. Convierte filas de la base de
// datos al mismo formato de "relato" que usa el frontend (camelCase).
// ============================================================================

const SELECT_RELATO = `
  SELECT r.*, a.nombre_original AS a_nombre, a.mime AS a_mime,
         a.tipo_medio AS a_tipo, a.tamano AS a_tamano
  FROM relatos r
  LEFT JOIN archivos a ON a.id = r.archivo_id`

function parseJson(valor, porDefecto) {
  if (!valor) return porDefecto
  try {
    return JSON.parse(valor)
  } catch {
    return porDefecto
  }
}

const aJson = (valor) => (valor == null ? null : JSON.stringify(valor))

const escaparLike = (s) => s.replace(/[\\%_]/g, '\\$&')

export function aRelato(row) {
  return {
    id: row.id,
    titulo: row.titulo,
    comunidad: row.comunidad,
    municipio: row.municipio,
    departamento: row.departamento,
    region: row.region,
    narrador: row.narrador,
    tipo: row.tipo,
    tematicas: parseJson(row.tematicas, []),
    epoca: row.epoca,
    fechaRegistro: row.fecha_registro,
    estado: row.estado,
    publicado: row.publicado === 1,
    publicadoEn: row.publicado_en,
    motivoDevolucion: row.motivo_devolucion,
    duracion: row.duracion ?? '—',
    iaGenerada: row.ia_generada === 1,
    palette: parseJson(row.palette, ['#2F4A3C', '#D08C2E']),
    fragmento: row.fragmento,
    transcripcion: parseJson(row.transcripcion, []),
    revisionIA: parseJson(row.revision_ia, null),
    descripcion: row.descripcion,
    archivo: row.archivo_id
      ? {
          id: row.archivo_id,
          url: `/api/archivos/${row.archivo_id}`,
          nombre: row.a_nombre,
          mime: row.a_mime,
          tipoMedio: row.a_tipo,
          tamano: row.a_tamano,
        }
      : null,
  }
}

export function createRepo(db) {
  const stmts = {
    insertarRelato: db.prepare(`
      INSERT INTO relatos (
        id, titulo, comunidad, municipio, departamento, region, narrador, tipo,
        tematicas, epoca, fecha_registro, estado, publicado, publicado_en,
        duracion, ia_generada, palette, fragmento, transcripcion, revision_ia,
        descripcion, consentimiento, archivo_id, creado_en
      ) VALUES (
        :id, :titulo, :comunidad, :municipio, :departamento, :region, :narrador, :tipo,
        :tematicas, :epoca, :fecha_registro, :estado, :publicado, :publicado_en,
        :duracion, :ia_generada, :palette, :fragmento, :transcripcion, :revision_ia,
        :descripcion, :consentimiento, :archivo_id, :creado_en
      )`),
    insertarArchivo: db.prepare(`
      INSERT INTO archivos (id, nombre_original, nombre_almacenado, mime, tipo_medio, tamano, sha256, creado_en)
      VALUES (:id, :nombre_original, :nombre_almacenado, :mime, :tipo_medio, :tamano, :sha256, :creado_en)`),
    obtener: db.prepare(`${SELECT_RELATO} WHERE r.id = ?`),
    pendientes: db.prepare(
      `${SELECT_RELATO} WHERE r.estado = 'en_revision' ORDER BY r.creado_en DESC, r.rowid DESC`
    ),
    actualizarEstado: db.prepare(`
      UPDATE relatos
      SET estado = :estado, publicado = :publicado, publicado_en = :publicado_en,
          motivo_devolucion = :motivo, actualizado_en = :ahora
      WHERE id = :id`),
    insertarActividad: db.prepare(
      'INSERT INTO actividad (texto, relato_id, fecha) VALUES (?, ?, ?)'
    ),
    actividad: db.prepare(
      'SELECT id, texto, relato_id AS relatoId, fecha FROM actividad ORDER BY id DESC LIMIT ?'
    ),
    obtenerArchivo: db.prepare('SELECT * FROM archivos WHERE id = ?'),
    archivos: db.prepare('SELECT * FROM archivos'),
    estadisticas: db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM relatos WHERE publicado = 1)                     AS publicados,
        (SELECT COUNT(*) FROM relatos WHERE estado = 'en_revision')            AS pendientes,
        (SELECT COUNT(*) FROM relatos WHERE estado = 'devuelto')               AS devueltos,
        (SELECT COUNT(DISTINCT comunidad) FROM relatos WHERE publicado = 1)    AS comunidades,
        (SELECT COUNT(DISTINCT departamento) FROM relatos WHERE publicado = 1) AS departamentos,
        (SELECT COUNT(*) FROM archivos)                                        AS archivos,
        (SELECT COALESCE(SUM(tamano), 0) FROM archivos)                        AS bytes`),
  }

  const obtener = (id) => {
    const row = stmts.obtener.get(id)
    return row ? aRelato(row) : null
  }

  return {
    obtener,

    listarPublicados(filtros = {}) {
      const where = ['r.publicado = 1']
      const params = {}
      for (const campo of ['departamento', 'tipo', 'epoca', 'region']) {
        if (filtros[campo]) {
          where.push(`r.${campo} = :${campo}`)
          params[campo] = filtros[campo]
        }
      }
      if (filtros.tematica) {
        where.push(
          'EXISTS (SELECT 1 FROM json_each(r.tematicas) WHERE json_each.value = :tematica)'
        )
        params.tematica = filtros.tematica
      }
      if (filtros.q) {
        where.push(`(r.titulo || ' ' || r.comunidad || ' ' || r.municipio || ' ' ||
          r.departamento || ' ' || r.narrador || ' ' || COALESCE(r.fragmento, '') || ' ' ||
          r.tematicas) LIKE :q ESCAPE '\\'`)
        params.q = `%${escaparLike(filtros.q)}%`
      }
      const limite = Math.min(Math.max(Number(filtros.limit) || 100, 1), 100)
      return db
        .prepare(
          `${SELECT_RELATO} WHERE ${where.join(' AND ')}
           ORDER BY r.publicado_en DESC, r.rowid ASC LIMIT ${limite}`
        )
        .all(params)
        .map(aRelato)
    },

    pendientes: () => stmts.pendientes.all().map(aRelato),

    crearRelato(r) {
      stmts.insertarRelato.run({
        id: r.id,
        titulo: r.titulo,
        comunidad: r.comunidad,
        municipio: r.municipio,
        departamento: r.departamento,
        region: r.region,
        narrador: r.narrador,
        tipo: r.tipo,
        tematicas: JSON.stringify(r.tematicas ?? []),
        epoca: r.epoca ?? null,
        fecha_registro: r.fechaRegistro,
        estado: r.estado,
        publicado: r.publicado ? 1 : 0,
        publicado_en: r.publicadoEn ?? null,
        duracion: r.duracion ?? null,
        ia_generada: r.iaGenerada ? 1 : 0,
        palette: aJson(r.palette),
        fragmento: r.fragmento ?? null,
        transcripcion: JSON.stringify(r.transcripcion ?? []),
        revision_ia: aJson(r.revisionIA),
        descripcion: r.descripcion ?? null,
        consentimiento: r.consentimiento ? 1 : 0,
        archivo_id: r.archivoId ?? null,
        creado_en: r.creadoEn,
      })
      return obtener(r.id)
    },

    crearArchivo(a) {
      stmts.insertarArchivo.run({
        id: a.id,
        nombre_original: a.nombreOriginal,
        nombre_almacenado: a.nombreAlmacenado,
        mime: a.mime,
        tipo_medio: a.tipoMedio,
        tamano: a.tamano,
        sha256: a.sha256,
        creado_en: a.creadoEn,
      })
    },

    actualizarEstado(id, { estado, publicado, motivo = null }) {
      const ahora = new Date().toISOString()
      stmts.actualizarEstado.run({
        id,
        estado,
        publicado: publicado ? 1 : 0,
        publicado_en: publicado ? ahora : null,
        motivo,
        ahora,
      })
      return obtener(id)
    },

    registrarActividad(texto, relatoId = null) {
      stmts.insertarActividad.run(texto, relatoId, new Date().toISOString())
    },

    actividad: (limite = 20) => stmts.actividad.all(limite),

    obtenerArchivo: (id) => stmts.obtenerArchivo.get(id) ?? null,

    listarArchivos: () => stmts.archivos.all(),

    estadisticas: () => ({ ...stmts.estadisticas.get() }),

    vaciar() {
      db.exec('DELETE FROM actividad; DELETE FROM relatos; DELETE FROM archivos;')
    },
  }
}
