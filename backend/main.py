from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import List, Optional
import os

# Import our custom engine
from tts_engine import engine, OUTPUT_DIR

# -------------------------------
# DATA MODELS
# -------------------------------

# Strict Language Enum to prevent errors
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
    HI = "hi" # Note: Hindi support varies by XTTS version
    UR = "ur" # Experimental support

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=2000, description="Text to synthesize")
    speaker: str = Field(..., description="Filename of the speaker wav (without extension)")
    language: Language = Field(default=Language.EN, description="Language code")
    format: str = Field(default="wav", pattern="^(wav|mp3)$")

    @field_validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError('Text cannot be empty')
        return v

# -------------------------------
# APP SETUP
# -------------------------------
app = FastAPI(
    title="XTTS Pro Studio API",
    version="2.1.0",
    description="High-performance Neural TTS Engine API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - Allow your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount output directory so frontend can play audio directly via URL if needed
app.mount("/static", StaticFiles(directory=OUTPUT_DIR), name="static")

# -------------------------------
# LIFECYCLE
# -------------------------------
@app.on_event("startup")
async def startup_event():
    # Pre-load model on startup so first request isn't slow
    engine.load_model()

# -------------------------------
# ENDPOINTS
# -------------------------------

@app.get("/health")
def health_check():
    return {"status": "online", "device": engine.device}

@app.get("/speakers", response_model=dict)
def get_speakers():
    """Fetch list of available voice clones"""
    try:
        speakers = engine.get_speakers()
        return {"speakers": speakers, "count": len(speakers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts", status_code=200)
def generate_speech(req: TTSRequest, background_tasks: BackgroundTasks):
    """
    Generate speech. 
    Note: defined as 'def' (not async) to run in threadpool, 
    preventing blocking of the main loop during GPU inference.
    """
    try:
        # Check if speaker exists
        if req.speaker not in engine.get_speakers():
            raise HTTPException(
                status_code=404, 
                detail=f"Speaker '{req.speaker}' not found. Please upload a reference audio."
            )

        # Generate Audio
        output_path = engine.generate(req.text, req.speaker, req.language.value)

        # Convert if needed
        final_path = output_path
        media_type = "audio/wav"
        
        if req.format == "mp3":
            final_path = engine.convert_to_mp3(output_path)
            media_type = "audio/mpeg"

        # Schedule cleanup
        background_tasks.add_task(engine.cleanup)

        # Return File
        return FileResponse(
            final_path, 
            media_type=media_type, 
            filename=os.path.basename(final_path)
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Critical Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Generation Error")