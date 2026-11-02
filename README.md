# Memoria Viva

Plataforma que usa IA para **preservar, organizar y visibilizar el patrimonio
cultural** de comunidades afro, indígenas y locales de Colombia: relatos
ancestrales, oralituras, cantos, oficios, saberes tradicionales y obras de
artistas locales.

> Proyecto académico (EAFIT). Frontend, API, base de datos, almacenamiento,
> **transcripción con Whisper** y **clasificación con un modelo de lenguaje** son
> reales y corren **en local y gratis**: los audios nunca salen del equipo. La
> ilustración aún es generativa (SVG); el modelo texto-a-imagen es la siguiente
> fase.

## Requisitos

- **Node.js 22.13 o superior** (usa el módulo `node:sqlite`; no hay que instalar
  ningún motor de base de datos).
- **Python 3.11 o 3.12** para el servicio de transcripción (Whisper).
- **[Ollama](https://ollama.com/)** con el modelo `mistral` para la clasificación:

  ```bash
  ollama pull mistral
  ```

  Es opcional: sin Ollama la app clasifica solo con reglas.

## Cómo correrlo

La primera vez:

```bash
npm install
npm run ia:instalar
```

`ia:instalar` crea un entorno de Python en `ia-service/.venv` e instala
faster-whisper. El modelo de Whisper (`small`, unos 460 MB) se descarga
automáticamente la primera vez que arranca el servicio.

Luego, cada vez:

```bash
npm run dev
```

`npm run dev` levanta tres procesos:

- **web** — Vite en http://localhost:5173 (abre esta)
- **api** — Express en http://localhost:3001 (Vite le redirige `/api`)
- **ia** — servicio de Whisper en http://127.0.0.1:8001

Mantén **una sola** terminal con `npm run dev`. Si Vite avisa
`Port 5173 is in use`, hay otra copia corriendo.

La primera vez se crea la base de datos con los relatos de ejemplo. Para volver
a los datos iniciales usa el enlace *"Reiniciar datos de demostración"* en la
vista **Avance**.

Otros comandos:

```bash
npm test          # 16 pruebas automatizadas (API + comunicación con Whisper y Ollama)
npm run build     # compila el frontend en dist/
npm start         # sirve API + frontend compilado en http://localhost:3001
```

### Variables de entorno opcionales

| Variable | Por defecto | Para qué |
|---|---|---|
| `API_PORT` | `3001` | Puerto de la API |
| `DB_PATH` | `server/data/memoria-viva.db` | Archivo de la base de datos |
| `UPLOADS_DIR` | `server/storage/uploads` | Carpeta de archivos subidos |
| `WHISPER_MODELO` | `small` | `tiny`, `base`, `small`, `medium` o `large-v3` (más grande = más preciso y más lento) |
| `WHISPER_IDIOMA` | `es` | Idioma del audio; vacío = detección automática |
| `IA_PORT` | `8001` | Puerto del servicio de Whisper |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Dirección de Ollama |
| `OLLAMA_MODELO` | `mistral` | Modelo de Ollama para clasificar |

## Pipeline de IA

1. **Transcripción** — `ia-service/main.py` corre
   [faster-whisper](https://github.com/SYSTRAN/faster-whisper) en CPU (int8) y
   agrupa el texto en párrafos según las pausas.
2. **Clasificación** — `server/services/ia.js` le pide a un modelo de lenguaje en
   Ollama tipo, temáticas, un resumen y alertas, con salida JSON validada contra
   un esquema. El modelo **no recibe el tipo registrado**, para que su opinión sea
   independiente; luego se compara con lo que eligió la persona.
3. **Reglas** — detectan expresiones de saberes restringidos o datos personales y
   complementan las alertas del modelo.
4. **Moderación humana** — una persona de la comunidad aprueba o devuelve el
   relato. La IA nunca publica sola.

El procesamiento corre en segundo plano (`server/services/procesador.js`): un
relato a la vez, con estado visible (`pendiente → transcribiendo → clasificando
→ listo`). Si Whisper está apagado el relato queda en `error` y se puede
reintentar; si Ollama está apagado, se clasifica solo con reglas.

**Rendimiento medido** (Intel Core Ultra 5, sin GPU): 33 s de audio se
transcriben en unos 7 s; la clasificación con Mistral 7B tarda de 25 a 45 s (la
primera vez incluye cargar el modelo en memoria).

**Limitación conocida:** Whisper no reconoce bien lenguas como el palenquero o
las lenguas indígenas; en esos casos la revisión humana es indispensable.

## Flujo

**Subir** un relato (con su archivo) → se guarda en la BD y en disco, pasa por
el pipeline de IA y entra a la **cola de Revisión** → la comunidad lo **aprueba**
(se publica en el **Catálogo**) o lo **devuelve** con un motivo. Nada se publica
sin aprobación.

## Vistas

- **Inicio** (`/`) — hero, problema, cómo funciona, relatos destacados.
- **Explorar** (`/catalogo`) — catálogo público con filtros y búsqueda resueltos en la BD.
- **Detalle** (`/relato/:id`) — registro original o ilustración IA, transcripción, audio real, ficha del archivo.
- **Subir** (`/subir`) — subida con progreso real y pipeline de IA paso a paso.
- **Revisión** (`/revision`) — moderación comunitaria con pre-revisión de IA y bitácora.
- **Avance** (`/avance`) — estado del sistema en vivo, avance ponderado, arquitectura, API, modelo de datos y roadmap.

## API REST

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/relatos` | Catálogo público (`q`, `departamento`, `tipo`, `tematica`, `epoca`, `region`, `limit`) |
| GET | `/api/relatos/:id` | Detalle de un relato publicado |
| POST | `/api/relatos` | Registro multipart (campos + `archivo`); responde `202` y encola el procesamiento con IA |
| GET | `/api/procesamiento/:id` | Estado del procesamiento con IA |
| POST | `/api/relatos/:id/reprocesar` | Reintentar el procesamiento con IA |
| GET | `/api/revision` | Cola de revisión |
| POST | `/api/relatos/:id/aprobar` | Aprobar y publicar |
| POST | `/api/relatos/:id/rechazar` | Devolver a la comunidad (`{ motivo }`) |
| GET | `/api/archivos/:id` | Archivo original (soporta rangos para audio/video) |
| GET | `/api/estadisticas` | Métricas |
| GET | `/api/actividad` | Bitácora |
| GET | `/api/salud` | Estado de la API, Whisper y el clasificador |

## Estructura

```
server/
  index.js            Arranque de la API
  app.js              Rutas, validación, subida de archivos y errores
  repositorio.js      Consultas SQL (único lugar con SQL)
  services/ia.js      Clientes de Whisper y Ollama, reglas de contenido sensible
  services/procesador.js  Cola de procesamiento en segundo plano
  db/database.js      Esquema SQLite (relatos, archivos, actividad)
  db/seed.js          Datos iniciales
  tests/api.test.js   Pruebas de integración (node:test) con Whisper y Ollama falsos
ia-service/
  main.py             Servicio de transcripción (FastAPI + faster-whisper)
  requirements.txt
scripts/
  ia.js               Instala y arranca el servicio de Python
src/
  api/client.js       Cliente HTTP (fetch + XHR con progreso de subida)
  hooks/useApi.js     Carga de datos con estados de carga/error
  context/            Estado compartido de la cola de revisión
  components/         Navbar, Footer, StoryCard, RelatoMedia, AudioPlayer, AiBadge…
  pages/              Home, Catalog, StoryDetail, Upload, Revision, Avance
  data/mockData.js    Taxonomías (departamentos, tipos, temáticas) y relatos semilla
```

La base de datos (`server/data/`) y los archivos subidos (`server/storage/`) no
se versionan.

## Dirección visual

- **Paleta:** archivo cultural cálido — papel/hueso, terracota, verde selva, ocre, añil textil.
- **Tipografía:** Fraunces (serif editorial) para títulos + Inter (sans) para lectura.
- **Imágenes:** si el relato trae foto o video, se muestra el original. Si no, una ilustración geométrica/textil (sin fotos de estereotipo) marcada con el badge *"Ilustración generada por IA"*.

## Próximos pasos

- Generación de ilustraciones con un modelo texto-a-imagen.
- Autenticación por roles (comunidad, revisor, público).
- Migración a PostgreSQL y almacenamiento en la nube; despliegue y piloto con una comunidad.
