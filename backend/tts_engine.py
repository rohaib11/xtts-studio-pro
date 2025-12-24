import os
import uuid
import time
import glob
import json
import logging
import threading
import torch
import subprocess
from pathlib import Path
from typing import List, Optional
from pydub import AudioSegment
import torchaudio

# FORCE LEGACY BACKEND TO FIX "TorchCodec" ERROR
torchaudio.set_audio_backend("soundfile") 

# Setup Rich Logging
from colorlog import ColoredFormatter
handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter(
    "%(log_color)s%(levelname)-8s%(reset)s %(blue)s%(message)s",
    datefmt=None,
    reset=True,
    log_colors={
        'DEBUG':    'cyan',
        'INFO':     'green',
        'WARNING':  'yellow',
        'ERROR':    'red',
        'CRITICAL': 'red,bg_white',
    }
))
logger = logging.getLogger("XTTS_Engine")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# -------------------------------
# PYTORCH FIXES
# -------------------------------
import torch.serialization
try:
    from TTS.tts.configs.xtts_config import XttsConfig
    torch.serialization.add_safe_globals([XttsConfig])
except ImportError:
    pass

# Patch torch.load for weights_only=False (Required for older checkpoints)
_original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_load(*args, **kwargs)
torch.load = patched_load

# -------------------------------
# CONFIGURATION
# -------------------------------
BASE_DIR = Path(__file__).parent.absolute()
OUTPUT_DIR = BASE_DIR / "output"
SPEAKERS_DIR = BASE_DIR / "speakers"
TEMP_DIR = BASE_DIR / "temp"

# Ensure directories exist
for d in [OUTPUT_DIR, SPEAKERS_DIR, TEMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

class TTSEngine:
    _instance = None
    _lock = threading.Lock() # Prevents concurrent GPU access crashing the model

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TTSEngine, cls).__new__(cls)
            cls._instance.model = None
            cls._instance.device = "cuda" if torch.cuda.is_available() else "cpu"
        return cls._instance

    def load_model(self):
        if self.model:
            return
        
        logger.info(f"⚙️  Initializing on Device: {self.device.upper()}")
        
        try:
            from TTS.api import TTS
            logger.info("🚀 Loading XTTS v2 Model (this may take a moment)...")
            # Using specific model path to avoid re-downloading checks if possible
            self.model = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(self.device)
            logger.info("✅ Model Loaded Successfully")
        except Exception as e:
            logger.critical(f"❌ Failed to load model: {e}")
            raise e

    def get_speakers(self) -> List[str]:
        """Returns list of available speaker .wav files"""
        return [f.stem for f in SPEAKERS_DIR.glob("*.wav")]

    def preprocess_speaker(self, speaker_name: str) -> str:
        """Converts speaker audio to 22050Hz Mono with UNIQUE ID to prevent file locking"""
        input_path = SPEAKERS_DIR / f"{speaker_name}.wav"
        
        if not input_path.exists():
            raise FileNotFoundError(f"Speaker {speaker_name} not found")

        # FIX: Add UUID to filename so multiple requests don't crash Windows file locking
        unique_id = uuid.uuid4().hex[:8]
        output_path = TEMP_DIR / f"{speaker_name}_{unique_id}.wav"

        # Basic ffmpeg conversion
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(input_path),
            "-ac", "1",
            "-ar", "22050",
            "-sample_fmt", "s16",
            str(output_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL)
        return str(output_path)

    def generate(self, text: str, speaker: str, language: str) -> str:
        """Thread-safe generation method"""
        
        # Ensure model is loaded
        if not self.model:
            self.load_model()

        # Validate Speaker
        if speaker not in self.get_speakers():
            raise ValueError("Invalid speaker selected")

        # Get unique temp file
        clean_speaker_wav = self.preprocess_speaker(speaker)
        output_filename = f"{uuid.uuid4()}.wav"
        output_path = OUTPUT_DIR / output_filename

        # ACQUIRE LOCK (Crucial for GPU stability)
        with self._lock:
            try:
                logger.info(f"🎙️  Generating: '{text[:20]}...' [{language}] -> {speaker}")
                
                self.model.tts_to_file(
                    text=text,
                    speaker_wav=clean_speaker_wav,
                    language=language,
                    file_path=str(output_path),
                    split_sentences=True
                )
                
                # Cleanup temp speaker file safely
                if os.path.exists(clean_speaker_wav):
                    try:
                        os.remove(clean_speaker_wav)
                    except PermissionError:
                        logger.warning(f"⚠️ Could not delete temp file {clean_speaker_wav} (File locked)")
                    
                logger.info(f"💾 Saved to: {output_filename}")
                return str(output_path)

            except Exception as e:
                logger.error(f"Generation failed: {e}")
                # Try to clean up even if generation failed
                if os.path.exists(clean_speaker_wav):
                    try: os.remove(clean_speaker_wav)
                    except: pass
                raise e

    def convert_to_mp3(self, wav_path: str) -> str:
        mp3_path = wav_path.replace(".wav", ".mp3")
        AudioSegment.from_wav(wav_path).export(mp3_path, format="mp3")
        return mp3_path

    def cleanup(self, max_age_seconds: int = 3600):
        """Background task to remove old files"""
        now = time.time()
        count = 0
        for f in OUTPUT_DIR.glob("*"):
            if f.stat().st_mtime < now - max_age_seconds:
                try:
                    os.remove(f)
                    count += 1
                except:
                    pass
        if count > 0:
            logger.info(f"🧹 Cleaned up {count} old audio files")

# Initialize Global Engine
engine = TTSEngine()