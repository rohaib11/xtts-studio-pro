
# 🎙️ XTTS Studio Pro — AI Voice Cloning Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-emerald" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue" />
  <img src="https://img.shields.io/badge/React-18-cyan" />
  <img src="https://img.shields.io/badge/Model-XTTS_v2-purple" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-green" />
  <img src="https://img.shields.io/badge/GPU-Optimized-orange" />
</p>

<p align="center">
  <b>High-Performance AI Voice Cloning & Text-to-Speech Platform</b><br>
  Modern UI • GPU-Safe • Production-Grade • XTTS v2 Powered
</p>

---

## 🚀 Overview

**XTTS Studio Pro** is a full-stack **AI Voice Cloning & Text-to-Speech dashboard** built on **Coqui XTTS v2**, enabling realistic multilingual speech generation using short voice references.

Designed for:
- 🎥 Content creators & YouTubers
- 🎮 Game developers
- 📚 Audiobook narration
- 🤖 AI assistants
- 🏢 Enterprise internal tools

---

## ✨ Key Features

### 🎙️ Voice & Speech
- 6–10 second voice cloning
- Multilingual TTS (EN, UR, HI, AR, ES, FR, DE, ZH, JA)
- WAV & MP3 output formats
- Natural neural speech synthesis
- Emotion preserved from reference voice

### 📤 Speaker Management
- Upload speakers via UI (Drag & Drop)
- Supports WAV, MP3, M4A, FLAC
- Auto speaker detection
- Windows-safe file handling

### ⚙️ Backend Engine Enhancements
- Thread-safe GPU inference
- Global model preload
- Automatic audio cleanup
- FFmpeg audio normalization
- CPU fallback support

### 🖥️ Frontend Experience
- Glassmorphism modern UI
- Real-time audio playback
- Session-based audio history
- Upload progress & notifications
- Server health monitoring
- Audio visualizer

---

## 🛠️ Tech Stack

### Backend
- FastAPI
- PyTorch
- Torchaudio
- Coqui XTTS v2
- FFmpeg
- Pydub

### Frontend
- React (Vite)
- Tailwind CSS
- Lucide Icons

---

## ⚙️ Installation

### Requirements
- Python 3.10+
- Node.js 18+
- FFmpeg (in PATH)
- NVIDIA GPU (recommended)

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### GPU Acceleration (Optional)
```bash
pip uninstall torch torchaudio -y
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Frontend Setup
```bash
cd frontend
npm install
```

---

## ▶️ Running the App

### Backend
```bash
uvicorn main:app --reload
```
API: http://127.0.0.1:8000  
Docs: http://127.0.0.1:8000/docs

### Frontend
```bash
npm run dev
```
UI: http://localhost:5173

---

## 🎙️ Adding New Voices

### Upload via UI (Recommended)
- Drag & drop a voice file
- Supported formats: WAV, MP3, M4A, FLAC
- Speaker appears instantly

### Manual Method
Place audio in:
```
backend/speakers/
```

---

## 🧠 API Overview

### Generate Speech
POST /tts
```json
{
  "text": "Hello world",
  "speaker": "rohaib",
  "language": "en",
  "format": "wav"
}
```

### Upload Speaker
POST /upload-speaker

### Health Check
GET /health

---

## 📂 Project Structure
```
xtts-studio-pro/
├── backend/
│   ├── main.py
│   ├── tts_engine.py
│   ├── speakers/
│   ├── output/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

---

## 🗺️ Roadmap
- Streaming TTS
- Usage analytics
- API key authentication
- Emotion & style control
- Docker & cloud deployment

---

## 📜 License
Educational & Research Use  
Follow Coqui XTTS (CPML) license for commercial use.

---

## 👨‍💻 Author
**Muhammad Rohaib**  
AI Engineer | Full-Stack Developer

---

⭐ Star the repo if you like it!
