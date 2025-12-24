import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, Play, Pause, Download, Wand2, 
  Settings2, History, Globe, User, 
  Cpu, Zap, Volume2, Trash2, Sparkles, 
  AlertCircle, CheckCircle2, Waves 
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Configuration ---
// 🔐 SECURITY HARDENING: Use Environment Variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// --- Utility for Cleaner Classes ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---
const GlassCard = ({ children, className, glow = false }) => (
  <div className={cn(
    "relative overflow-hidden bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl transition-all duration-300",
    glow && "shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] border-indigo-500/20",
    className
  )}>
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const Badge = ({ children, variant = "neutral" }) => {
  const variants = {
    neutral: "bg-zinc-800/50 text-zinc-400 border-zinc-700/50",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accent: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border", variants[variant])}>
      {children}
    </span>
  );
};

// --- Main App ---
export default function App() {
  const [text, setText] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [language, setLanguage] = useState("en");
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [playing, setPlaying] = useState(null); 
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("checking"); // checking, online, offline

  const audioRef = useRef(new Audio());

  const languages = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'ur', label: 'Urdu', flag: '🇵🇰' },
    { id: 'hi', label: 'Hindi', flag: '🇮🇳' },
    { id: 'ar', label: 'Arabic', flag: '🇸🇦' },
    { id: 'es', label: 'Spanish', flag: '🇪🇸' },
    { id: 'fr', label: 'French', flag: '🇫🇷' },
    { id: 'zh-cn', label: 'Chinese', flag: '🇨🇳' },
    { id: 'ja', label: 'Japanese', flag: '🇯🇵' },
  ];

  // Initialize
  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = () => {
    setBackendStatus("checking");
    // ✅ FIX: Use API_URL constant
    fetch(`${API_URL}/speakers`)
      .then((res) => res.json())
      .then((data) => {
        // ✅ FIX: Handle both Array and Object formats
        const list = Array.isArray(data) ? data : data.speakers;
        setSpeakers(list || []);
        if (list?.length && !speaker) setSpeaker(list[0]);
        setBackendStatus("online");
      })
      .catch(() => {
        setError("Cannot connect to AI Engine. Is the backend running?");
        setBackendStatus("offline");
      });
  };

  // Audio Logic
  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => setPlaying(null);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
    };
  }, []);

  const togglePlay = (url) => {
    const audio = audioRef.current;
    if (playing === url) {
      audio.pause();
      setPlaying(null);
    } else {
      audio.src = url;
      audio.play();
      setPlaying(url);
    }
  };

  const generateVoice = async () => {
    if (!text || !speaker) return;

    // 🚀 PERFORMANCE UPGRADE: Prevent massive text crash
    if (text.length > 2000) {
      setError("Text too long. Please keep under 2000 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ FIX: Use API_URL constant
      const res = await fetch(`${API_URL}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker, language, format: "mp3" }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Generation failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const newItem = {
        id: Date.now(),
        text: text,
        speaker,
        language,
        url,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory(prev => [newItem, ...prev]);

      // 🔧 AUDIO BUG FIX: Reset audio before playing new file
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlaying(null);
      
      togglePlay(url);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadAudio = (url, id) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `xtts_render_${id}.mp3`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      
      {/* --- Ambient Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-800/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-800/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      {/* --- Navbar --- */}
      <header className="relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-indigo-600 to-blue-700 p-2 rounded-xl border border-white/10">
                <Waves className="text-white w-5 h-5" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                XTTS <span className="text-indigo-400">Studio</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-white/5">
              <div className={cn("w-2 h-2 rounded-full", backendStatus === 'online' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
              <span className="text-xs font-mono text-zinc-400 uppercase">
                {backendStatus === 'online' ? "System Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Editor */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <GlassCard className="flex-1 flex flex-col shadow-2xl" glow={loading}>
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                <Mic size={14} /> Script Editor
              </div>
              <div className="flex gap-2">
                 <Badge variant="accent">{language.toUpperCase()}</Badge>
                 <Badge>{text.length} Chars</Badge>
              </div>
            </div>

            {/* Text Area */}
            <div className="relative flex-1 group">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write something amazing..."
                className="w-full h-full bg-transparent p-8 text-xl md:text-2xl text-zinc-100 placeholder:text-zinc-700 resize-none focus:outline-none font-light leading-relaxed custom-scrollbar"
                spellCheck={false}
              />
              {/* Floating Generate Button */}
              <div className="absolute bottom-6 right-6">
                 <button 
                  onClick={generateVoice} 
                  disabled={loading || !text || backendStatus !== 'online'}
                  className="group relative flex items-center gap-3 pl-4 pr-6 py-3 bg-white text-black rounded-full font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
                 >
                   {loading ? (
                     <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                       <Sparkles size={14} />
                     </div>
                   )}
                   <span>{loading ? "Synthesizing..." : "Generate Audio"}</span>
                 </button>
              </div>
            </div>
          </GlassCard>

          {/* Visualizer */}
          <GlassCard className="h-24 flex items-center justify-center px-10 gap-1.5 bg-black/60">
             {loading || playing ? (
               Array.from({ length: 60 }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, Math.random() * 48 + 8, 4],
                    backgroundColor: playing ? ["#6366f1", "#818cf8", "#6366f1"] : ["#10b981", "#34d399", "#10b981"]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5,
                    ease: "easeInOut",
                    delay: i * 0.02
                  }}
                  className="w-1.5 rounded-full opacity-80"
                />
              ))
             ) : (
               <div className="flex items-center gap-3 text-zinc-600 font-mono text-sm uppercase tracking-widest">
                 <Waves size={16} /> Audio Engine Idle
               </div>
             )}
          </GlassCard>

          {/* Error Toast */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0 }}
                className="absolute bottom-6 left-6 right-6 bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 backdrop-blur-xl"
              >
                <AlertCircle className="text-red-500" />
                <span className="flex-1 text-sm font-medium">{error}</span>
                <button onClick={() => checkBackend()} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded text-xs uppercase font-bold">Retry</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANEL: Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
          
          {/* Controls */}
          <GlassCard className="p-1 flex flex-col gap-1">
            <div className="p-4 pb-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <User size={12} /> Voice Model
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {speakers.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => setSpeaker(sp)}
                    className={cn(
                      "group w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all",
                      speaker === sp 
                        ? "bg-indigo-500/20 border-indigo-500/30 text-white" 
                        : "bg-transparent border-transparent hover:bg-white/5 text-zinc-400"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", speaker === sp ? "bg-indigo-400 shadow-[0_0_8px_currentColor]" : "bg-zinc-700")} />
                      <span className="text-sm font-medium truncate">{sp}</span>
                    </div>
                    {speaker === sp && <CheckCircle2 size={14} className="text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5 mx-4" />

            <div className="p-4 pt-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                <Globe size={12} /> Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={cn(
                      "px-3 py-2 text-xs rounded-lg border transition-all flex items-center gap-2",
                      language === lang.id
                        ? "bg-white text-black border-white font-bold"
                        : "bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-zinc-800"
                    )}
                  >
                    <span>{lang.flag}</span> {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* History */}
          <GlassCard className="flex-1 flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <History size={12} /> Session Library
              </h3>
              <Badge>{history.length}</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              <AnimatePresence>
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                       <Volume2 size={24} />
                    </div>
                    <p className="text-xs font-mono">NO AUDIO GENERATED</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "relative p-3 rounded-xl border transition-all group overflow-hidden",
                        playing === item.url 
                          ? "bg-indigo-900/20 border-indigo-500/30" 
                          : "bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-800/40"
                      )}
                    >
                      {playing === item.url && (
                        <motion.div 
                           layoutId="active-glow"
                           className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" 
                        />
                      )}
                      
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <div className="flex flex-col gap-1 w-full mr-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{item.speaker}</span>
                              <span className="text-[10px] text-zinc-600 font-mono">{item.timestamp}</span>
                           </div>
                           <p className="text-xs font-medium text-zinc-300 line-clamp-1 opacity-80">{item.text}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between gap-2 pl-2 mt-3">
                        <button
                          onClick={() => togglePlay(item.url)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                            playing === item.url
                              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                              : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                          )}
                        >
                          {playing === item.url ? <><Pause size={10} fill="currentColor"/> STOP</> : <><Play size={10} fill="currentColor"/> PLAY</>}
                        </button>
                        
                        <button 
                           onClick={() => downloadAudio(item.url, item.id)}
                           className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </main>

      {/* --- Styles --- */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}