"""
Servicio local de transcripción de Memoria Viva.

Usa faster-whisper (Whisper sobre CTranslate2) en CPU con cuantización int8.
El audio nunca sale del computador: el modelo se descarga una vez y luego
todo corre de forma local.

Variables de entorno:
  WHISPER_MODELO  tiny | base | small | medium | large-v3   (por defecto: small)
  WHISPER_IDIOMA  código ISO, p. ej. "es"; vacío = detección automática (por defecto: es)
  IA_PORT         puerto del servicio (por defecto: 8001)
"""

import logging
import os
import shutil
import tempfile
import threading
import time
from contextlib import asynccontextmanager

# Windows sin modo desarrollador no permite symlinks en la caché de Hugging Face;
# funciona igual, así que se silencia la advertencia (debe ir antes de importar
# faster_whisper).
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from faster_whisper import WhisperModel

MODELO = os.getenv("WHISPER_MODELO", "small")
IDIOMA = os.getenv("WHISPER_IDIOMA", "es") or None
PUERTO = int(os.getenv("IA_PORT", "8001"))

logging.basicConfig(level=logging.INFO, format="[whisper] %(message)s")
log = logging.getLogger("whisper")
# Las descargas del modelo generan un log por cada petición HTTP.
logging.getLogger("httpx").setLevel(logging.WARNING)

estado = {"modelo": None, "error": None}


def cargar_modelo():
    # La primera vez descarga el modelo (~460 MB para "small") a la caché de
    # Hugging Face del usuario; las siguientes lo carga desde disco.
    try:
        inicio = time.perf_counter()
        log.info("Cargando modelo '%s' (CPU, int8)…", MODELO)
        estado["modelo"] = WhisperModel(MODELO, device="cpu", compute_type="int8")
        log.info("Modelo listo en %.1f s", time.perf_counter() - inicio)
    except Exception as err:  # noqa: BLE001 — se reporta en /salud
        estado["error"] = str(err)
        log.error("No se pudo cargar el modelo: %s", err)


@asynccontextmanager
async def lifespan(_app):
    # Se carga en segundo plano para que /salud responda mientras tanto.
    threading.Thread(target=cargar_modelo, daemon=True).start()
    yield


app = FastAPI(title="Memoria Viva — Whisper local", lifespan=lifespan)


def agrupar_parrafos(segmentos, pausa=1.5, max_caracteres=600):
    """Une segmentos en párrafos: corta en pausas largas o párrafos muy extensos."""
    parrafos, actual, fin_anterior = [], [], None
    for seg in segmentos:
        texto = seg["texto"]
        if not texto:
            continue
        largo = sum(len(t) for t in actual)
        if actual and (seg["inicio"] - fin_anterior > pausa or largo > max_caracteres):
            parrafos.append(" ".join(actual))
            actual = []
        actual.append(texto)
        fin_anterior = seg["fin"]
    if actual:
        parrafos.append(" ".join(actual))
    return parrafos


@app.get("/salud")
def salud():
    return {
        "ok": estado["modelo"] is not None,
        "estado": "listo" if estado["modelo"] else ("error" if estado["error"] else "cargando"),
        "modelo": MODELO,
        "idioma": IDIOMA or "auto",
        "error": estado["error"],
    }


# Función síncrona: FastAPI la ejecuta en un hilo aparte y no bloquea /salud.
@app.post("/transcribir")
def transcribir(archivo: UploadFile = File(...)):
    modelo = estado["modelo"]
    if modelo is None:
        raise HTTPException(503, estado["error"] or "cargando")

    sufijo = os.path.splitext(archivo.filename or "")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=sufijo) as tmp:
        shutil.copyfileobj(archivo.file, tmp)
        ruta = tmp.name

    try:
        inicio = time.perf_counter()
        # vad_filter descarta silencios y reduce las "alucinaciones" de Whisper.
        segmentos, info = modelo.transcribe(ruta, language=IDIOMA, vad_filter=True, beam_size=5)
        segmentos = [
            {"inicio": round(s.start, 2), "fin": round(s.end, 2), "texto": s.text.strip()}
            for s in segmentos
        ]
        segundos = time.perf_counter() - inicio
    except Exception as err:  # noqa: BLE001
        raise HTTPException(422, f"No se pudo procesar el audio: {err}") from err
    finally:
        os.remove(ruta)

    log.info(
        "%s: %.1f s de audio transcritos en %.1f s", archivo.filename, info.duration, segundos
    )
    return {
        "parrafos": agrupar_parrafos(segmentos),
        "segmentos": segmentos,
        "idioma": info.language,
        "probabilidadIdioma": round(info.language_probability, 3),
        "duracion": round(info.duration, 2),
        "segundosProceso": round(segundos, 2),
        "modelo": MODELO,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=PUERTO, log_level="warning")
