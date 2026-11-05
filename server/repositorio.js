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
    procesamiento: row.procesamiento,
    procesamientoError: row.procesamiento_error,
    idioma: row.idioma,
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

// Usuario sin el hash de la contraseña, en el formato de la API.
function aUsuario(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    activo: row.activo === 1,
    creadoEn: row.creado_en,
    ultimoIngreso: row.ultimo_ingreso,
  }
}

export function createRepo(db) {
  const stmts = {
    insertarRelato: db.prepare(`
      INSERT INTO relatos (
        id, titulo, comunidad, municipio, departamento, region, narrador, tipo,
        tematicas, epoca, fecha_registro, estado, publicado, publicado_en,
        duracion, ia_generada, palette, fragmento, transcripcion, revision_ia,
        descripcion, consentimiento, archivo_id, creado_en, procesamiento
      ) VALUES (
        :id, :titulo, :comunidad, :municipio, :departamento, :region, :narrador, :tipo,
        :tematicas, :epoca, :fecha_registro, :estado, :publicado, :publicado_en,
        :duracion, :ia_generada, :palette, :fragmento, :transcripcion, :revision_ia,
        :descripcion, :consentimiento, :archivo_id, :creado_en, :procesamiento
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
          motivo_devolucion = :motivo, revisado_por = :revisado_por, actualizado_en = :ahora
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
        (SELECT COALESCE(SUM(tamano), 0) FROM archivos)                        AS bytes,
        (SELECT COUNT(*) FROM relatos
          WHERE procesamiento IN ('pendiente', 'transcribiendo', 'clasificando')) AS procesando`),
    marcarProcesamiento: db.prepare(
      'UPDATE relatos SET procesamiento = ?, procesamiento_error = ?, actualizado_en = ? WHERE id = ?'
    ),
    guardarTranscripcion: db.prepare(`
      UPDATE relatos SET transcripcion = :transcripcion, duracion = :duracion, idioma = :idioma,
             fragmento = COALESCE(:fragmento, fragmento), actualizado_en = :ahora
      WHERE id = :id`),
    guardarClasificacion: db.prepare(
      'UPDATE relatos SET region = ?, tematicas = ?, revision_ia = ?, actualizado_en = ? WHERE id = ?'
    ),
    // --- Usuarios y sesiones ----------------------------------------------
    crearUsuario: db.prepare(`
      INSERT INTO usuarios (id, nombre, correo, clave_hash, rol, activo, creado_en)
      VALUES (:id, :nombre, :correo, :clave_hash, :rol, 1, :creado_en)`),
    usuarioPorCorreo: db.prepare('SELECT * FROM usuarios WHERE correo = ?'),
    usuarioPorId: db.prepare('SELECT * FROM usuarios WHERE id = ?'),
    listarUsuarios: db.prepare(
      `SELECT id, nombre, correo, rol, activo, creado_en, ultimo_ingreso
       FROM usuarios ORDER BY activo DESC, rol, nombre`
    ),
    contarUsuarios: db.prepare('SELECT COUNT(*) AS n FROM usuarios'),
    cambiarActivo: db.prepare('UPDATE usuarios SET activo = ? WHERE id = ?'),
    registrarIngreso: db.prepare('UPDATE usuarios SET ultimo_ingreso = ? WHERE id = ?'),
    eliminarUsuario: db.prepare('DELETE FROM usuarios WHERE id = ?'),
    soltarRevisiones: db.prepare('UPDATE relatos SET revisado_por = NULL WHERE revisado_por = ?'),
    crearSesion: db.prepare(
      'INSERT INTO sesiones (id, usuario_id, creado_en, expira_en) VALUES (?, ?, ?, ?)'
    ),
    usuarioDeSesion: db.prepare(`
      SELECT u.id, u.nombre, u.correo, u.rol
      FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.id = ? AND s.expira_en > ? AND u.activo = 1`),
    eliminarSesion: db.prepare('DELETE FROM sesiones WHERE id = ?'),
    eliminarSesionesDe: db.prepare('DELETE FROM sesiones WHERE usuario_id = ?'),
    limpiarSesiones: db.prepare('DELETE FROM sesiones WHERE expira_en <= ?'),

    porProcesar: db.prepare(
      `SELECT id FROM relatos WHERE procesamiento IN ('pendiente', 'transcribiendo', 'clasificando')
       ORDER BY creado_en ASC, rowid ASC`
    ),
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
        procesamiento: r.procesamiento ?? 'listo',
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

    actualizarEstado(id, { estado, publicado, motivo = null, revisadoPor = null }) {
      const ahora = new Date().toISOString()
      stmts.actualizarEstado.run({
        id,
        estado,
        publicado: publicado ? 1 : 0,
        publicado_en: publicado ? ahora : null,
        motivo,
        revisado_por: revisadoPor,
        ahora,
      })
      return obtener(id)
    },

    registrarActividad(texto, relatoId = null) {
      stmts.insertarActividad.run(texto, relatoId, new Date().toISOString())
    },

    actividad: (limite = 20) => stmts.actividad.all(limite),

    // --- Procesamiento con IA -------------------------------------------
    marcarProcesamiento(id, estado, error = null) {
      stmts.marcarProcesamiento.run(estado, error, new Date().toISOString(), id)
    },

    guardarTranscripcion(id, { transcripcion, duracion, idioma, fragmento = null }) {
      stmts.guardarTranscripcion.run({
        id,
        transcripcion: JSON.stringify(transcripcion),
        duracion,
        idioma,
        fragmento,
        ahora: new Date().toISOString(),
      })
    },

    guardarClasificacion(id, { region, tematicas, revisionIA }) {
      stmts.guardarClasificacion.run(
        region,
        JSON.stringify(tematicas),
        aJson(revisionIA),
        new Date().toISOString(),
        id
      )
    },

    idsPorProcesar: () => stmts.porProcesar.all().map((r) => r.id),

    // --- Usuarios y sesiones ----------------------------------------------
    crearUsuario({ id, nombre, correo, claveHash, rol }) {
      stmts.crearUsuario.run({
        id,
        nombre,
        correo: correo.toLowerCase(),
        clave_hash: claveHash,
        rol,
        creado_en: new Date().toISOString(),
      })
      return aUsuario(stmts.usuarioPorId.get(id))
    },

    // Incluye el hash de la contraseña: solo para verificar el ingreso.
    usuarioConClave: (correo) => stmts.usuarioPorCorreo.get(correo.toLowerCase()) ?? null,
    usuarioPorCorreo: (correo) => {
      const row = stmts.usuarioPorCorreo.get(correo.toLowerCase())
      return row ? aUsuario(row) : null
    },
    usuarioPorId: (id) => {
      const row = stmts.usuarioPorId.get(id)
      return row ? aUsuario(row) : null
    },
    listarUsuarios: () => stmts.listarUsuarios.all().map(aUsuario),
    contarUsuarios: () => stmts.contarUsuarios.get().n,

    cambiarActivo(id, activo) {
      stmts.cambiarActivo.run(activo ? 1 : 0, id)
      if (!activo) stmts.eliminarSesionesDe.run(id)
      return aUsuario(stmts.usuarioPorId.get(id))
    },

    eliminarUsuario(id) {
      stmts.soltarRevisiones.run(id)
      stmts.eliminarSesionesDe.run(id)
      stmts.eliminarUsuario.run(id)
    },

    registrarIngreso: (id) => stmts.registrarIngreso.run(new Date().toISOString(), id),

    crearSesion({ id, usuarioId, duracionMs }) {
      const ahora = new Date()
      stmts.limpiarSesiones.run(ahora.toISOString())
      stmts.crearSesion.run(
        id,
        usuarioId,
        ahora.toISOString(),
        new Date(ahora.getTime() + duracionMs).toISOString()
      )
    },
    usuarioDeSesion: (id) =>
      stmts.usuarioDeSesion.get(id, new Date().toISOString()) ?? null,
    eliminarSesion: (id) => stmts.eliminarSesion.run(id),

    obtenerArchivo: (id) => stmts.obtenerArchivo.get(id) ?? null,

    listarArchivos: () => stmts.archivos.all(),

    estadisticas: () => ({ ...stmts.estadisticas.get() }),

    vaciar() {
      db.exec('DELETE FROM actividad; DELETE FROM relatos; DELETE FROM archivos;')
    },
  }
}
