# 🎙️ XTTS Studio Pro — AI Voice Cloning Dashboard

<p align="center">
   <img src="https://img.shields.io/badge/Status-Active-emerald" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-blue" />
  <img src="https://img.shields.io/badge/React-18-cyan" />
  <img src="https://img.shields.io/badge/Model-XTTS_v2-purple" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-green" />

 
</p>

<p align="center">
  <b>High‑Performance AI Voice Cloning & Text‑to‑Speech Platform</b><br>
  Cyberpunk UI • GPU Optimized • Production Ready
</p>

---

## 🚀 Overview

**XTTS Studio Pro** is a modern, production‑grade **AI Voice Cloning dashboard** that allows you to generate natural, human‑like speech using short reference audios.

Designed for:
- 🎥 YouTube creators
- 🎮 Game developers
- 📚 Audiobook production
- 🤖 AI assistants

---

## ✨ Features

✅ 6‑Second Voice Cloning  
✅ Multi‑Language Speech (EN, UR, HI, AR, ES, FR, etc.)  
✅ Real‑time Audio Generation  
✅ Cyberpunk Glassmorphism UI  
✅ Thread‑Safe GPU Inference  
✅ Session Audio History  
✅ MP3 / WAV Export  
✅ Windows‑Safe File Handling  

---

## 🖼️ Screenshots

> Add your screenshots here after deployment

```
docs/screenshots/dashboard.png
docs/screenshots/voice_clone.png
docs/screenshots/audio_history.png
```

Example:
```md
![Dashboard](docs/screenshots/dashboard.png)
```

---

## 🛠️ Tech Stack

### Backend
- FastAPI
- PyTorch
- Torchaudio
- Coqui XTTS v2
- FFmpeg

### Frontend
- React (Vite)
- Tailwind CSS
- Framer Motion
- Lucide Icons

---

## ⚙️ Installation

### Requirements
- Python 3.10+
- Node.js 18+
- FFmpeg (in PATH)
- NVIDIA GPU (optional but recommended)

---

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

#### 🔥 GPU Acceleration (Optional)

```bash
pip uninstall torch torchaudio -y
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

---

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
📍 http://127.0.0.1:8000

 📍 http://127.0.0.1:8000/docs
### Frontend

```bash
npm run dev
```
📍 http://localhost:5173

---

## 🎙️ Adding New Voices

1. Prepare a **clean 6–10 second WAV file**
2. Rename it (example: `rohaib.wav`)
3. Place it in:

```
backend/speakers/
```

4. Refresh UI → Voice appears automatically

---

## 🧠 API Overview

### Generate Speech

```http
POST /tts
```

```json
{
  "text": "Hello world",
  "speaker": "rohaib",
  "language": "en",
  "format": "wav"
}
```

---

## 📂 Project Structure
```json
xtts-studio-pro/
│
├── backend/
│   ├── main.py
│   ├── tts_engine.py
│   ├── speakers/
│   ├── output/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   └── package.json
│
└── README.md
```

## 🛡️ Troubleshooting

### Torch / Codec Errors
```bash
pip install transformers==4.40.2 accelerate==0.30.1 torchaudio<2.6
```

### Slow Generation
➡️ You are on CPU. Install CUDA PyTorch.

### No Speakers Found
➡️ Ensure `.wav` files exist in `backend/speakers/`

---

## 📜 License

Educational & Research Use Only  
Follow Coqui XTTS (CPML) license for commercial usage.

---

## 👨‍💻 Author

**Muhammad Rohaib**  
🚀 AI Engineer | Full‑Stack Developer

---

⭐ If you like this project, give it a star!
