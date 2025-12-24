import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, Play, Download, Trash2, Languages, Loader2, 
  Volume2, Server, Upload, FileAudio, Settings, X,
  CheckCircle2, AlertCircle, Sparkles, Music4
} from 'lucide-react';

const API_URL = "http://localhost:8000";

// --- CONSTANTS ---
const LANGUAGES = [
  { code: "en", name: "English (US)" },
  { code: "ur", name: "Urdu (Pakistan)" },
  { code: "ar", name: "Arabic (Saudi)" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "zh-cn", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi (India)" },
];

// --- COMPONENTS ---

// 1. Toast Notification Component
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-slide-up z-50 ${
    type === 'error' 
      ? 'bg-rose-950/80 border-rose-500/30 text-rose-200' 
      : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
  }`}>
    {type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
    <p className="font-medium text-sm">{message}</p>
    <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
  </div>
);

// 2. Audio Visualizer (CSS Animation)
const Visualizer = ({ isActive }) => (
  <div className="flex items-center justify-center gap-1 h-8">
    {[...Array(8)].map((_, i) => (
      <div 
        key={i}
        className={`w-1.5 bg-indigo-500 rounded-full transition-all duration-300 ${isActive ? 'animate-music-bar' : 'h-1'}`}
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
);

const App = () => {
  // --- STATE ---
  const [text, setText] = useState("");
  const [speakers, setSpeakers] = useState([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [audioFormat, setAudioFormat] = useState("wav");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null); // { message, type }

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- HOOKS ---
  useEffect(() => {
    checkHealth();
    fetchSpeakers();
    
    // Auto-dismiss toast
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- API FUNCTIONS ---
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) setIsServerOnline(true);
    } catch (err) { setIsServerOnline(false); }
  };

  const fetchSpeakers = async () => {
    try {
      const response = await fetch(`${API_URL}/speakers`);
      const data = await response.json();
      setSpeakers(data.speakers);
      if (!selectedSpeaker && data.speakers.length > 0) {
        setSelectedSpeaker(data.speakers[0]);
      }
    } catch (err) {
      showToast("Could not load voice profiles", "error");
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // --- HANDLERS ---
  
  // Drag & Drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload-speaker`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      
      const data = await response.json();
      await fetchSpeakers();
      setSelectedSpeaker(data.speaker);
      showToast(`Voice "${data.speaker}" cloned successfully!`);
    } catch (err) {
      showToast("Failed to upload voice sample", "error");
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!text || !selectedSpeaker) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          speaker: selectedSpeaker,
          language: selectedLanguage,
          format: audioFormat
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const newItem = {
        id: Date.now(),
        text: text,
        speaker: selectedSpeaker,
        language: selectedLanguage,
        format: audioFormat,
        url: url,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistory([newItem, ...history]);
      showToast("Audio generated successfully!");
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-indigo-500/30">
      
      {/* --- NOTIFICATIONS --- */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* --- BACKGROUND ACCENTS --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Music4 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              XTTS<span className="font-light">Studio</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              isServerOnline 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isServerOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {isServerOnline ? "ENGINE ONLINE" : "OFFLINE"}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
        
        {/* --- LEFT PANEL: STUDIO --- */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Text to Speech</h2>
                <p className="text-slate-400 text-sm">Craft human-like audio with AI.</p>
              </div>
              
              {/* Character Counter Ring */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle cx="20" cy="20" r="16" className="stroke-slate-700 fill-none" strokeWidth="3" />
                  <circle 
                    cx="20" cy="20" r="16" 
                    className={`fill-none transition-all duration-500 ${text.length > 1800 ? 'stroke-rose-500' : 'stroke-indigo-500'}`} 
                    strokeWidth="3" 
                    strokeDasharray="100" 
                    strokeDashoffset={100 - (text.length / 2000) * 100} 
                  />
                </svg>
                <span className="absolute text-[10px] font-medium text-slate-300">{Math.round((text.length / 2000) * 100)}%</span>
              </div>
            </div>

            {/* Text Area */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start typing or paste your script here..."
              className="w-full h-48 bg-slate-950/50 border border-white/10 rounded-xl p-5 text-lg text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none resize-none transition-all shadow-inner"
              maxLength={2000}
            />

            {/* Controls Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              
              {/* Speaker Card */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Voice Profile</label>
                
                {/* Drag & Drop Zone */}
                <div 
                  className={`relative group border-2 border-dashed rounded-xl transition-all duration-300 ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="p-4 flex flex-col gap-3">
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => setSelectedSpeaker(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {speakers.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {dragActive ? "Drop file now!" : "Or drag .wav file here"}
                      </span>
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 transition-colors"
                        title="Upload New Voice"
                      >
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".wav,.mp3" />
                  </div>
                </div>
              </div>

              {/* Settings Card */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Output Settings</label>
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-4">
                  
                  {/* Language */}
                  <div className="relative">
                    <Languages className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>

                  {/* Format Toggle */}
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
                    {['wav', 'mp3'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setAudioFormat(fmt)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                          audioFormat === fmt 
                          ? "bg-indigo-600 text-white shadow-lg" 
                          : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !text || !selectedSpeaker}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center gap-3 transition-all transform active:scale-[0.99] ${
                isLoading || !text
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-900/20 border border-indigo-500/20"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="animate-pulse">Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-indigo-200/20" />
                  Generate Audio
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- RIGHT PANEL: LIBRARY --- */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center justify-between mb-2">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-indigo-500" />
               Recent Generations
             </h2>
             {history.length > 0 && (
                <button onClick={() => setHistory([])} className="text-xs text-slate-500 hover:text-rose-400 transition-colors">
                  Clear All
                </button>
             )}
           </div>

           <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-4">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center">
                   <Volume2 className="w-6 h-6 opacity-50" />
                </div>
                <p>No audio generated yet.</p>
              </div>
            ) : (
              history.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`group bg-slate-900/80 border transition-all duration-300 rounded-2xl p-5 ${
                    index === 0 ? "border-indigo-500/40 shadow-lg shadow-indigo-500/10" : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                        {item.language.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{item.speaker}</h3>
                        <p className="text-xs text-slate-500">{item.timestamp}</p>
                      </div>
                    </div>
                    {index === 0 && isLoading && <Visualizer isActive={true} />}
                  </div>

                  <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed pl-1 border-l-2 border-slate-700">
                    {item.text}
                  </p>

                  <div className="bg-slate-950/50 rounded-lg p-2 mb-4 border border-slate-800">
                    <audio 
                      ref={index === 0 ? audioRef : null}
                      controls 
                      src={item.url} 
                      className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" 
                    />
                  </div>

                  <div className="flex gap-2">
                    <a 
                      href={item.url} 
                      download={`xtts-${item.id}.${item.format}`}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-slate-700"
                    >
                      <Download className="w-4 h-4" /> Save {item.format.toUpperCase()}
                    </a>
                    <button 
                      onClick={() => setHistory(history.filter(h => h.id !== item.id))}
                      className="px-3 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 border border-slate-700 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
           </div>
        </div>
      </main>
      
      {/* CSS for custom scrollbar and animations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        .animate-music-bar { animation: music-bar 1s ease-in-out infinite; }
        
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
