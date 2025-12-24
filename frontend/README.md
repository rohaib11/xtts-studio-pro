echo "# 🎙️ XTTS Studio Pro - AI Voice Cloning Dashboard

![Project Status](https://img.shields.io/badge/Status-Active-emerald)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![React](https://img.shields.io/badge/React-18-cyan)
![XTTS](https://img.shields.io/badge/Model-XTTS_v2-purple)

A high-performance, modern web dashboard for **Neural Voice Cloning** and Text-to-Speech generation. Built with **FastAPI** and **React**, featuring a cyberpunk-inspired UI, real-time audio visualization, and multi-language support.

---

## ✨ Features

- **🗣️ Instant Voice Cloning:** Clone any voice with just a 6-second reference audio file (\`.wav\`).
- **🌍 Multi-Language Support:** Supports English, Urdu, Hindi, Arabic, Spanish, French, and more.
- **🎨 Modern Glassmorphism UI:** Cyberpunk aesthetic with live waveform visualizations and smooth animations.
- **⚡ Optimised Backend:** Thread-safe GPU/CPU management to prevent crashing during multiple requests.
- **📂 Session History:** Automatically saves generated audio clips with playback and download options.
- **🛡️ Error Handling:** Auto-fixes common file-locking issues on Windows.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework:** FastAPI (Python)
- **AI Model:** Coqui TTS (XTTS v2)
- **Audio Processing:** PyTorch, Torchaudio, FFmpeg
- **Task Management:** BackgroundTasks (Async cleanup)

### **Frontend**
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS, Framer Motion
- **Icons:** Lucide React

---

## 🚀 Installation Guide

### Prerequisites
1. **Python 3.10+** installed.
2. **Node.js** installed (for the frontend).
3. **FFmpeg** installed and added to System PATH.
4. **C++ Build Tools** (Visual Studio Build Tools) if on Windows.

### 1️⃣ Backend Setup
\`\`\`bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Install dependencies (Strict versioning for stability)
pip install -r requirements.txt

# IF YOU HAVE AN NVIDIA GPU (Run this to make generation fast)
pip uninstall torch torchaudio
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
\`\`\`

### 2️⃣ Frontend Setup
\`\`\`bash
cd frontend
npm install
\`\`\`

---

## ▶️ Usage

### Start the Backend
\`\`\`bash
cd backend
# Make sure venv is active
uvicorn main:app --reload
# Server will start at http://127.0.0.1:8000
\`\`\`

### Start the Frontend
\`\`\`bash
cd frontend
npm run dev
# UI will launch at http://localhost:5173
\`\`\`

### 🎙️ Adding New Voices
1. Find a clear audio clip (6-10 seconds) of the person you want to clone.
2. Save it as a \`.wav\` file (e.g., \`obama.wav\`, \`rohaib.wav\`).
3. Place the file inside \`backend/speakers/\`.
4. Refresh the web page. The voice will appear in the dropdown!

---

## 🔧 Troubleshooting

**1. \"TorchCodec\" or \"BeamSearchScorer\" Errors:**
These are caused by version conflicts in the latest PyTorch/Transformers libraries. We have fixed this in \`requirements.txt\`, but if you see them, run:
\`\`\`bash
pip install \"transformers==4.40.2\" \"accelerate==0.30.1\" \"torchaudio<2.6\"
\`\`\`

**2. Generation is Slow (2-3 minutes):**
You are likely running on **CPU**. To get 5-second generation speeds, you must install the CUDA version of PyTorch and have an NVIDIA GPU.

**3. \"No speakers found\":**
Ensure you have at least one \`.wav\` file in the \`backend/speakers/\` folder.

---

## 📜 License
This project is for educational and research purposes. Please respect the license of the Coqui XTTS model (CPML) regarding commercial use.

---

**Developed by Muhammad Rohaib**" > README.md

git add README.md
git commit -m "Add documentation"
git push origin main
