from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import List
import os
import shutil
import subprocess

# Import XTTS engine (UNCHANGED)
from tts_engine import engine, OUTPUT_DIR

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
# APP SETUP
# -------------------------------

app = FastAPI(
    title="XTTS Pro Studio API",
    version="2.2.0",
    description="High-performance Neural TTS Engine API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# -------------------------------
# CORS (SAFE DEFAULT)
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
# STARTUP CHECKS (SAFE ADDITION)
# -------------------------------

def check_ffmpeg():
    """Non-breaking FFmpeg availability check"""
    if shutil.which("ffmpeg") is None:
        print("⚠️ WARNING: FFmpeg not found. MP3 conversion may fail.")

@app.on_event("startup")
async def startup_event():
    check_ffmpeg()
    engine.load_model()

# -------------------------------
# ENDPOINTS
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
    """
    Blocking endpoint intentionally (GPU safe).
    Existing logic preserved.
    """
    try:
        # Validate speaker
        if req.speaker not in engine.get_speakers():
            raise HTTPException(
                status_code=404,
                detail=f"Speaker '{req.speaker}' not found"
            )

        # Generate WAV
        output_path = engine.generate(
            req.text,
            req.speaker,
            req.language.value
        )

        final_path = output_path
        media_type = "audio/wav"

        # Optional MP3 conversion (UNCHANGED FLOW)
        if req.format == "mp3":
            final_path = engine.convert_to_mp3(output_path)
            media_type = "audio/mpeg"

        # 🧹 SAFE delayed cleanup (ENHANCEMENT)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Critical Error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal Generation Error"
        )
