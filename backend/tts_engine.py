import os
import uuid
import time
import logging
import threading
import subprocess
from pathlib import Path
from typing import List

import torch
import torchaudio
from pydub import AudioSegment

# --------------------------------
# TORCHAUDIO BACKEND FIX (UNCHANGED)
# --------------------------------
torchaudio.set_audio_backend("soundfile")

# --------------------------------
# LOGGING (UNCHANGED)
# --------------------------------
from colorlog import ColoredFormatter

handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter(
    "%(log_color)s%(levelname)-8s%(reset)s %(blue)s%(message)s",
    log_colors={
        "DEBUG": "cyan",
        "INFO": "green",
        "WARNING": "yellow",
        "ERROR": "red",
        "CRITICAL": "red,bg_white",
    }
))

logger = logging.getLogger("XTTS_Engine")
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# --------------------------------
# TORCH SERIALIZATION PATCH (UNCHANGED)
# --------------------------------
import torch.serialization
try:
    from TTS.tts.configs.xtts_config import XttsConfig
    torch.serialization.add_safe_globals([XttsConfig])
except ImportError:
    pass

_original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _original_load(*args, **kwargs)
torch.load = patched_load

# --------------------------------
# PATH CONFIGURATION (UNCHANGED)
# --------------------------------
BASE_DIR = Path(__file__).parent.absolute()
OUTPUT_DIR = BASE_DIR / "output"
SPEAKERS_DIR = BASE_DIR / "speakers"
TEMP_DIR = BASE_DIR / "temp"

for d in (OUTPUT_DIR, SPEAKERS_DIR, TEMP_DIR):
    d.mkdir(parents=True, exist_ok=True)

# --------------------------------
# XTTS ENGINE (SAFE ENHANCED)
# --------------------------------
class TTSEngine:
    _instance = None
    _lock = threading.Lock()  # GPU SAFETY LOCK (UNCHANGED)

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.model = None
            cls._instance.device = "cuda" if torch.cuda.is_available() else "cpu"
        return cls._instance

    # ----------------------------
    # MODEL LOADING (UNCHANGED)
    # ----------------------------
    def load_model(self):
        if self.model:
            return

        logger.info(f"⚙️ Initializing XTTS on {self.device.upper()}")

        try:
            from TTS.api import TTS
            self.model = TTS(
                "tts_models/multilingual/multi-dataset/xtts_v2"
            ).to(self.device)
            logger.info("✅ XTTS Model Loaded")
        except Exception as e:
            logger.critical(f"❌ Model load failed: {e}")
            raise

    # ----------------------------
    # SPEAKER HANDLING (UNCHANGED)
    # ----------------------------
    def get_speakers(self) -> List[str]:
        return [f.stem for f in SPEAKERS_DIR.glob("*.wav")]

    def preprocess_speaker(self, speaker_name: str) -> str:
        input_path = SPEAKERS_DIR / f"{speaker_name}.wav"

        if not input_path.exists():
            raise FileNotFoundError(f"Speaker '{speaker_name}' not found")

        unique_id = uuid.uuid4().hex[:8]
        output_path = TEMP_DIR / f"{speaker_name}_{unique_id}.wav"

        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(input_path),
            "-ac", "1",
            "-ar", "22050",
            "-sample_fmt", "s16",
            str(output_path)
        ]

        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return str(output_path)

    # ----------------------------
    # GENERATION (UNCHANGED LOGIC)
    # ----------------------------
    def generate(self, text: str, speaker: str, language: str) -> str:
        if not self.model:
            self.load_model()

        if speaker not in self.get_speakers():
            raise ValueError("Invalid speaker selected")

        clean_speaker_wav = self.preprocess_speaker(speaker)
        output_path = OUTPUT_DIR / f"{uuid.uuid4()}.wav"

        with self._lock:
            try:
                logger.info(f"🎙️ Generating [{language}] → {speaker}")

                self.model.tts_to_file(
                    text=text,
                    speaker_wav=clean_speaker_wav,
                    language=language,
                    file_path=str(output_path),
                    split_sentences=True
                )

                logger.info(f"💾 Audio saved: {output_path.name}")
                return str(output_path)

            except Exception as e:
                logger.error(f"❌ Generation failed: {e}")
                raise

            finally:
                # SAFE TEMP CLEANUP (ENHANCEMENT)
                if os.path.exists(clean_speaker_wav):
                    try:
                        os.remove(clean_speaker_wav)
                    except PermissionError:
                        logger.warning("⚠️ Temp file locked, cleanup skipped")

    # ----------------------------
    # MP3 CONVERSION (SAFE FIX)
    # ----------------------------
    def convert_to_mp3(self, wav_path: str) -> str:
        mp3_path = wav_path.replace(".wav", ".mp3")
        AudioSegment.from_wav(wav_path).export(mp3_path, format="mp3")

        # SAFE: remove WAV after conversion
        try:
            os.remove(wav_path)
        except Exception:
            pass

        return mp3_path

    # ----------------------------
    # CLEANUP TASK (UNCHANGED)
    # ----------------------------
    def cleanup(self, max_age_seconds: int = 3600):
        now = time.time()
        removed = 0

        for f in OUTPUT_DIR.glob("*"):
            if f.stat().st_mtime < now - max_age_seconds:
                try:
                    os.remove(f)
                    removed += 1
                except Exception:
                    pass

        if removed:
            logger.info(f"🧹 Cleaned {removed} old files")

# --------------------------------
# GLOBAL ENGINE INSTANCE
# --------------------------------
engine = TTSEngine()

