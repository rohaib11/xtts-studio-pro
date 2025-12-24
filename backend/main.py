# -------------------------------
# UPDATED IMPORTS (SAFE ADDITION)
# -------------------------------
from fastapi import FastAPI, HTTPException, BackgroundTasks, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import List
import os
import shutil
import subprocess

# -------------------------------
# XTTS ENGINE IMPORT (UPDATED)
# -------------------------------
from tts_engine import engine, OUTPUT_DIR, SPEAKERS_DIR

# -------------------------------
# DATA MODELS (UNCHANGED)
# -------------------------------

class Language(str, Enum):
    EN = "en"
    ES = "es"
    FR = "fr"
    DE = "de"
    IT = "it"
    PT = "pt"
    PL = "pl"
    TR = "tr"
    RU = "ru"
    NL = "nl"
    CS = "cs"
    AR = "ar"
    ZH = "zh-cn"
    JA = "ja"
    HU = "hu"
    KO = "ko"
    HI = "hi"
    UR = "ur"

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=2000)
    speaker: str = Field(...)
    language: Language = Field(default=Language.EN)
    format: str = Field(default="wav", pattern="^(wav|mp3)$")

    @field_validator("text")
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError("Text cannot be empty")
        return v

# -------------------------------
# APP SETUP (UNCHANGED)
# -------------------------------

app = FastAPI(
    title="XTTS Pro Studio API",
    version="2.2.0",
    description="High-performance Neural TTS Engine API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# -------------------------------
# CORS (UNCHANGED)
# -------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# STATIC FILES (UNCHANGED)
# -------------------------------

app.mount("/static", StaticFiles(directory=OUTPUT_DIR), name="static")

# -------------------------------
# STARTUP CHECKS (UNCHANGED)
# -------------------------------

def check_ffmpeg():
    if shutil.which("ffmpeg") is None:
        print("⚠️ WARNING: FFmpeg not found. MP3 conversion may fail.")

@app.on_event("startup")
async def startup_event():
    check_ffmpeg()
    engine.load_model()

# -------------------------------
# EXISTING ENDPOINTS (UNCHANGED)
# -------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "device": engine.device,
    }

@app.get("/speakers", response_model=dict)
def get_speakers():
    try:
        speakers = engine.get_speakers()
        return {
            "speakers": speakers,
            "count": len(speakers)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts", status_code=200)
def generate_speech(req: TTSRequest, background_tasks: BackgroundTasks):
    try:
        if req.speaker not in engine.get_speakers():
            raise HTTPException(
                status_code=404,
                detail=f"Speaker '{req.speaker}' not found"
            )

        output_path = engine.generate(
            req.text,
            req.speaker,
            req.language.value
        )

        final_path = output_path
        media_type = "audio/wav"

        if req.format == "mp3":
            final_path = engine.convert_to_mp3(output_path)
            media_type = "audio/mpeg"

        background_tasks.add_task(
            engine.cleanup,
            max_age_seconds=7200
        )

        return FileResponse(
            final_path,
            media_type=media_type,
            filename=os.path.basename(final_path)
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Critical Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal Generation Error"
        )

# --------------------------------------------------
# ✅ NEW ENDPOINT: UPLOAD SPEAKER (SAFE ADDITION)
# --------------------------------------------------

@app.post("/upload-speaker")
async def upload_speaker(file: UploadFile = File(...)):
    """
    Allows users to upload a new reference voice (wav/mp3/m4a/flac)
    """
    try:
        allowed_extensions = {".wav", ".mp3", ".m4a", ".flac"}
        filename = file.filename.lower()

        if not any(filename.endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .wav, .mp3, .m4a, .flac allowed."
            )

        safe_name = "".join(
            c for c in file.filename if c.isalnum() or c in "._-"
        )

        save_path = SPEAKERS_DIR / safe_name

        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "status": "success",
            "speaker": save_path.stem,
            "filename": safe_name
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
