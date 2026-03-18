import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAISettings } from "@/hooks/useAISettings";
import { cn } from "@/lib/utils";
import type { AppView } from "@/pages/AppDashboard";
import { HorusConstellation } from "@/components/app/HorusConstellation";

/* ── TypewriterText ──────────────────────────────────────────────────── */
const BATCH = typeof window !== "undefined" && window.innerWidth < 768 ? 5 : 3;
const TypewriterText = ({ text, speed = 28 }: { text: string; speed?: number }) => {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setShown(""); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + BATCH, text.length);
      setShown(text.slice(0, i));
      if (i >= text.length) { setDone(true); clearInterval(id); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span>
      {shown}
      {!done && (
        <motion.span
          className="inline-block w-[2px] h-[1em] bg-cyan-400/80 align-middle ml-0.5 rounded-sm"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.7, repeat: Infinity }}
        />
      )}
    </span>
  );
};

/* ── Audio waveform bars ─────────────────────────────────────────────── */
const BAR_H = [5, 10, 16, 22, 14, 20, 11, 24, 16, 13, 20, 9, 18, 24, 11, 7, 14, 22, 9, 17];
const AudioBars = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-[3px]" style={{ height: 32 }}>
    {BAR_H.map((maxH, i) => (
      <motion.div
        key={i}
        className="w-[2.5px] rounded-full"
        style={{
          height: maxH,
          transformOrigin: "center",
          background: active ? "rgba(0,210,255,0.75)" : "rgba(0,210,255,0.18)",
        }}
        animate={
          active
            ? { scaleY: [0.12, 1, 0.3, 0.85, 0.12], opacity: [0.4, 1, 0.5, 0.8, 0.4] }
            : { scaleY: 0.12, opacity: 0.18 }
        }
        transition={{
          duration: 0.42 + ((i * 0.06) % 0.45),
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
          delay: (i * 0.04) % 0.35,
        }}
      />
    ))}
  </div>
);

/* ── HUD corner brackets ─────────────────────────────────────────────── */
const HudCorner = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => {
  const top = pos.startsWith("t");
  const left = pos.endsWith("l");
  return (
    <span
      className="absolute pointer-events-none"
      style={{
        width: 24, height: 24,
        top:    top  ? 0 : "auto",
        bottom: !top ? 0 : "auto",
        left:   left ? 0 : "auto",
        right:  !left ? 0 : "auto",
        borderTop:    top  ? "1.5px solid rgba(0,210,255,0.65)" : "none",
        borderBottom: !top ? "1.5px solid rgba(0,210,255,0.65)" : "none",
        borderLeft:   left ? "1.5px solid rgba(0,210,255,0.65)" : "none",
        borderRight:  !left ? "1.5px solid rgba(0,210,255,0.65)" : "none",
      }}
    />
  );
};

/* ── Scanning sweep line ─────────────────────────────────────────────── */
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-px pointer-events-none"
    style={{
      background: "linear-gradient(90deg, transparent 0%, rgba(0,210,255,0.35) 50%, transparent 100%)",
      zIndex: 1,
    }}
    animate={{ top: ["0%", "100%"] }}
    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
  />
);

/* ── Navigation keyword parser ───────────────────────────────────────── */
const VIEW_KEYWORDS: [RegExp, AppView][] = [
  [/\b(tarefa|tarefas|tasks?)\b/i, "tasks"],
  [/\b(h[aá]bito|h[aá]bitos|habits?)\b/i, "habits"],
  [/\b(finan[cç]a|finan[cç]as|financeiro|finances?)\b/i, "finances"],
  [/\b(agenda|calend[aá]rio|calendar)\b/i, "agenda"],
  [/\b(nota|notas|notes?)\b/i, "notes"],
  [/\b(lembrete|lembretes|reminders?)\b/i, "reminders"],
  [/\b(gmail|e-?mail)\b/i, "gmail"],
  [/\b(whatsapp)\b/i, "whatsapp"],
  [/\b(projeto|projetos|kanban|projects?)\b/i, "projects"],
  [/\b(an[aá]lise|an[aá]lises|analysis)\b/i, "analysis"],
  [/\b(dashboard|in[ií]cio|home|inicio)\b/i, "dashboard"],
  [/\b(configura[cç][aã]o|configura[cç][oõ]es|settings?)\b/i, "settings"],
  [/\b(chat|ia)\b/i, "chat"],
];

const NAV_VERBS = /\b(abri[r]?|mostr[ar]?|ir\s+para|naveg[ar]?|v[aá]\s+para|abre|quero\s+ver|me\s+leva|leva[-\s]?me)\b/i;

const VIEW_LABELS: Partial<Record<AppView, string>> = {
  tasks: "Tarefas", habits: "Hábitos", finances: "Finanças",
  agenda: "Agenda", notes: "Notas", reminders: "Lembretes",
  gmail: "Gmail", whatsapp: "WhatsApp", projects: "Projetos",
  analysis: "Análise", dashboard: "Dashboard", settings: "Configurações", chat: "Horus IA",
};

const parseNav = (text: string): AppView | null => {
  const hasNavVerb = NAV_VERBS.test(text);
  for (const [pat, view] of VIEW_KEYWORDS) {
    if (pat.test(text) && (hasNavVerb || text.trim().split(/\s+/).length <= 3)) return view;
  }
  return null;
};

/* ── Constants ───────────────────────────────────────────────────────── */
const TTS_FN = "tts";
const EL_TTS_FN = "elevenlabs-tts";

type JarvisState = "idle" | "listening" | "processing" | "responding";

const STATUS_TEXT: Record<JarvisState, string> = {
  idle: "PRONTO",
  listening: "OUVINDO",
  processing: "PROCESSANDO",
  responding: "RESPONDENDO",
};

const STATUS_COLOR: Record<JarvisState, string> = {
  idle: "rgba(0,210,255,0.55)",
  listening: "rgba(0,255,140,0.95)",
  processing: "rgba(160,80,255,0.95)",
  responding: "rgba(0,210,255,0.95)",
};

/* ── Main component ──────────────────────────────────────────────────── */
interface NeuralJarvisInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

export const NeuralJarvisInterface = ({
  isOpen,
  onClose,
  onNavigate,
}: NeuralJarvisInterfaceProps) => {
  const [state, setState] = useState<JarvisState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [muted, setMuted] = useState(false);

  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const streamRef    = useRef<MediaStream | null>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const { user }     = useAuth();
  const { settings } = useAISettings();

  const globeSize =
    typeof window !== "undefined"
      ? Math.min(300, Math.min(window.innerWidth * 0.58, window.innerHeight * 0.38))
      : 260;

  /* ── Keyboard shortcuts ───────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === " " && !["INPUT","TEXTAREA"].includes((e.target as HTMLElement)?.tagName ?? "")) {
        e.preventDefault();
        if (state === "idle") startRec();
        else if (state === "listening") stopRec();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, state]);

  /* ── Cleanup on close ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) {
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      releaseStream();
      audioRef.current?.pause();
      audioRef.current = null;
      setTranscript("");
      setResponse("");
      setState("idle");
    }
  }, [isOpen]);

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  /* ── Recording ───────────────────────────────────────────────────── */
  const startRec = async () => {
    if (state !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = ["audio/webm", "audio/mp4", "audio/aac", "audio/mpeg"].find(
        t => MediaRecorder.isTypeSupported(t)
      ) ?? "";
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/mp4" });
        releaseStream();
        processVoice(blob);
      };
      rec.start(250);
      setState("listening");
      setTranscript("");
      setResponse("");
    } catch (e) {
      console.error(e);
      releaseStream();
    }
  };

  const stopRec = () => {
    const rec = recorderRef.current;
    if (rec && state === "listening") {
      if (rec.state !== "inactive") rec.stop();
      else releaseStream();
      setState("processing");
    }
  };

  /* ── Voice processing pipeline ───────────────────────────────────── */
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve((r.result as string).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

  const speak = async (text: string) => {
    if (!text || muted) return;
    try {
      const fn = settings.voiceProvider === "elevenlabs" ? EL_TTS_FN : TTS_FN;
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { text: text.replace(/[*#_`~\[\]()>]/g, ""), voiceId: settings.voiceId },
      });
      if (error || !data?.audio) return;
      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audioRef.current = audio;
      await audio.play().catch(() => {});
      await new Promise<void>(res => { audio.onended = () => res(); audio.onerror = () => res(); });
    } catch {}
  };

  const processVoice = async (blob: Blob) => {
    setState("processing");
    try {
      // 1. Transcribe
      const base64 = await blobToBase64(blob);
      const { data: stt, error: sttErr } = await supabase.functions.invoke("gemini-stt", {
        body: { audio: base64, mimeType: blob.type },
      });
      if (sttErr) throw sttErr;
      const text: string = stt?.text || "";
      if (!text) { setState("idle"); return; }
      setTranscript(text);

      // 2. Check direct navigation command
      const navView = parseNav(text);
      if (navView) {
        const label = VIEW_LABELS[navView] ?? navView;
        const msg = `Abrindo ${label}.`;
        setResponse(msg);
        setState("responding");
        await speak(msg);
        onNavigate(navView);
        onClose();
        return;
      }

      // 3. Send to AI chat
      if (!user) { setState("idle"); return; }

      // Get conversation
      const { data: convos } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1);

      let convId: string | null = null;
      if (convos && convos.length > 0) {
        convId = convos[0].id;
      } else {
        const { data: newConv } = await supabase
          .from("chat_conversations")
          .insert({ user_id: user.id, title: "Conversa principal" })
          .select("id")
          .single();
        convId = newConv?.id ?? null;
      }
      if (!convId) { setState("idle"); return; }

      const { data: chat, error: chatErr } = await supabase.functions.invoke("chat", {
        body: {
          message: text,
          conversationId: convId,
          userId: user.id,
          settings: {
            assistantName: settings.assistantName,
            voiceEnabled: settings.voiceEnabled,
            voiceProvider: settings.voiceProvider,
            voiceId: settings.voiceId,
          },
        },
      });
      if (chatErr) throw chatErr;

      const aiText: string = chat?.response || "";
      const truncated = aiText.length > 240 ? aiText.slice(0, 240) + "…" : aiText;
      setResponse(truncated);
      setState("responding");

      // Check if AI suggests navigation
      const aiNav = parseNav(aiText);

      await speak(truncated);

      if (aiNav) {
        onNavigate(aiNav);
        onClose();
      } else {
        setTimeout(() => setState("idle"), 1500);
      }
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  };

  const handleMic = () => {
    if (state === "idle") startRec();
    else if (state === "listening") stopRec();
  };

  const isListening   = state === "listening";
  const isProcessing  = state === "processing";
  const isResponding  = state === "responding";

  const btnDisabled = isProcessing || isResponding;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center select-none"
          style={{ background: "rgba(2,13,22,0.96)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Grid overlay */}
          <div className="absolute inset-0 jarvis-grid opacity-[0.065] pointer-events-none" />

          {/* Radial vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 80% at center, transparent 40%, rgba(2,13,22,0.75) 100%)",
            }}
          />

          {/* Scan sweep */}
          <ScanLine />

          {/* ── Top header ────────────────────────────────────────── */}
          <motion.div
            className="absolute top-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{
                  background: STATUS_COLOR[state],
                  boxShadow: `0 0 10px ${STATUS_COLOR[state]}`,
                }}
                animate={
                  isListening
                    ? { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }
                    : isProcessing
                    ? { rotate: 360 }
                    : {}
                }
                transition={
                  isListening
                    ? { duration: 0.9, repeat: Infinity }
                    : isProcessing
                    ? { duration: 1.2, repeat: Infinity, ease: "linear" }
                    : {}
                }
              />
              <span
                className="text-[11px] font-mono tracking-[0.38em] font-bold"
                style={{ color: STATUS_COLOR[state] }}
              >
                {STATUS_TEXT[state]}
              </span>
            </div>

            <h1
              className="text-[2.4rem] font-black tracking-[0.3em] leading-none"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              HORUS
            </h1>
            <p className="text-[9px] font-mono text-cyan-400/35 tracking-[0.3em]">
              ASSISTENTE NEURAL PESSOAL
            </p>
          </motion.div>

          {/* ── Corner HUD brackets ───────────────────────────────── */}
          {(["tl", "tr", "bl", "br"] as const).map((pos, i) => (
            <motion.div
              key={pos}
              className="absolute"
              style={{
                width: 44,
                height: 44,
                top:    pos.startsWith("t") ? 56  : "auto",
                bottom: pos.startsWith("b") ? 56  : "auto",
                left:   pos.endsWith("l")   ? 16  : "auto",
                right:  pos.endsWith("r")   ? 16  : "auto",
              }}
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.18 + i * 0.06, type: "spring", stiffness: 180 }}
            >
              <HudCorner pos={pos} />
            </motion.div>
          ))}

          {/* ── Side decorative bars ──────────────────────────────── */}
          {["left-5", "right-5"].map(side => (
            <div
              key={side}
              className={`absolute ${side} top-1/2 -translate-y-1/2 flex flex-col items-center gap-[6px]`}
            >
              {[8, 12, 18, 12, 8, 5].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-cyan-400"
                  style={{ height: h }}
                  animate={{ opacity: [0.15, 0.6, 0.15] }}
                  transition={{ duration: 1.4 + i * 0.25, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
          ))}

          {/* ── User transcript (above orb) ───────────────────────── */}
          <AnimatePresence>
            {transcript && (
              <motion.div
                className="absolute text-center px-12 max-w-md"
                style={{ bottom: `calc(50% + ${globeSize / 2 + 36}px)` }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-white/60 text-sm italic leading-relaxed">
                  "{transcript}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Central HorusConstellation ────────────────────────── */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.65, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", stiffness: 130, damping: 20 }}
          >
            <HorusConstellation
              isThinking={isProcessing}
              isSpeaking={isListening || isResponding}
              size={globeSize}
            />
          </motion.div>

          {/* ── AI response (below orb) ───────────────────────────── */}
          <AnimatePresence>
            {response && (
              <motion.div
                className="absolute text-center px-12 max-w-lg"
                style={{ top: `calc(50% + ${globeSize / 2 + 18}px)` }}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-cyan-300/85 text-sm leading-relaxed font-light">
                  <TypewriterText text={response} />
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bottom controls ───────────────────────────────────── */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            {/* Waveform */}
            <AudioBars active={isListening} />

            {/* Mic button */}
            <motion.button
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300",
                isListening  && "bg-emerald-500/15",
                isProcessing && "bg-violet-500/15",
                (!isListening && !isProcessing) && "bg-cyan-500/8 hover:bg-cyan-500/15",
              )}
              style={{
                border: `1.5px solid ${
                  isListening  ? "rgba(0,255,140,0.7)"  :
                  isProcessing ? "rgba(160,80,255,0.7)" :
                                 "rgba(0,210,255,0.4)"
                }`,
                boxShadow: isListening
                  ? "0 0 20px rgba(0,255,140,0.25), inset 0 0 12px rgba(0,255,140,0.08)"
                  : isProcessing
                  ? "0 0 20px rgba(160,80,255,0.25)"
                  : "0 0 14px rgba(0,210,255,0.1)",
              }}
              onClick={handleMic}
              disabled={btnDisabled}
              whileTap={!btnDisabled ? { scale: 0.91 } : {}}
            >
              {/* Listening pulse rings */}
              {isListening && [1, 2].map(k => (
                <motion.div
                  key={k}
                  className="absolute inset-0 rounded-full border border-emerald-400/30"
                  animate={{ scale: [1, 1.5 + k * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.5, ease: "easeOut" }}
                />
              ))}

              {isListening  ? <MicOff  className="w-6 h-6 text-emerald-300" /> :
               isProcessing ? <Loader2 className="w-6 h-6 text-violet-300 animate-spin" /> :
                              <Mic     className="w-6 h-6 text-cyan-300" />}
            </motion.button>

            <p className="text-[10px] font-mono text-cyan-400/35 tracking-[0.3em]">
              {isListening ? "TOQUE PARA PARAR • ESPAÇO" :
               state === "idle" ? "TOQUE OU PRESSIONE ESPAÇO" : ""}
            </p>
          </motion.div>

          {/* ── Quick navigation chips ────────────────────────────── */}
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-2 flex-wrap justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 0.55 }}
          >
            {(
              [
                ["Tarefas",  "tasks"],
                ["Finanças", "finances"],
                ["Hábitos",  "habits"],
                ["Agenda",   "agenda"],
                ["Notas",    "notes"],
              ] as [string, AppView][]
            ).map(([label, view]) => (
              <button
                key={view}
                className="text-[10px] font-mono text-cyan-400/55 hover:text-cyan-300 px-2.5 py-0.5 rounded transition-all"
                style={{ border: "1px solid rgba(0,210,255,0.18)" }}
                onClick={() => { onNavigate(view); onClose(); }}
              >
                {label}
              </button>
            ))}
          </motion.div>

          {/* ── Top-right utility buttons ─────────────────────────── */}
          <div className="absolute top-4 right-4 flex gap-2">
            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all"
              style={{ border: "1px solid rgba(0,210,255,0.2)" }}
              onClick={() => setMuted(m => !m)}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22 }}
              title={muted ? "Ativar voz" : "Silenciar voz"}
            >
              {muted
                ? <VolumeX className="w-3.5 h-3.5" />
                : <Volume2 className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button
              className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-400/10 transition-all"
              style={{ border: "1px solid rgba(0,210,255,0.2)" }}
              onClick={onClose}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28 }}
              title="Fechar (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* ── Keyboard hint ─────────────────────────────────────── */}
          <motion.div
            className="absolute top-4 left-4 flex flex-col gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.6 }}
          >
            <span className="text-[9px] font-mono text-cyan-400/60 tracking-widest">ESC · fechar</span>
            <span className="text-[9px] font-mono text-cyan-400/60 tracking-widest">ALT+H · ativar</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
