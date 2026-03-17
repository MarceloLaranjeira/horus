import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Mic, MicOff, Loader2, CheckSquare, DollarSign, Flame, Bell, Calendar, Trash2, VolumeX, Volume2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useAISettings } from "@/hooks/useAISettings";
import { HorusConstellation } from "@/components/app/HorusConstellation";
import type { AppView } from "@/pages/AppDashboard";

/* ── Typewriter effect component ──────────────────────────────────── */
// Batch size: render N chars per tick to avoid 55 re-renders/sec on mobile
const TYPEWRITER_BATCH = typeof window !== "undefined" && window.innerWidth < 768 ? 6 : 3;
const TypewriterText = ({ text, speed = 25 }: { text: string; speed?: number }) => {
  const [shown, setShown] = useState("");
  const [done, setDone]   = useState(false);
  useEffect(() => {
    setShown(""); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i = Math.min(i + TYPEWRITER_BATCH, text.length);
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
          className="inline-block w-[2px] h-[1.1em] bg-cyan-400/80 align-middle ml-0.5 rounded-sm"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.75, repeat: Infinity }}
        />
      )}
    </span>
  );
};

/* ── Audio visualizer bars ────────────────────────────────────────── */
const BAR_H_FULL   = [4, 9, 16, 22, 14, 20, 10, 24, 16, 12, 20, 8, 18, 24, 10, 6, 14, 22, 8, 16];
const BAR_H_MOBILE = [4, 14, 22, 12, 20, 8, 18, 10, 16, 6];
const IS_MOBILE_BARS = typeof window !== "undefined" && window.innerWidth < 768;
const BAR_H = IS_MOBILE_BARS ? BAR_H_MOBILE : BAR_H_FULL;

const AudioBars = ({ active, color = "rgba(0,200,255," }: { active: boolean; color?: string }) => (
  <div className="flex items-center gap-[2.5px]" style={{ height: 28 }}>
    {BAR_H.map((maxH, i) => (
      <motion.div
        key={i}
        className="w-[2px] rounded-full"
        style={{ height: maxH, transformOrigin: "center", background: color + (active ? "0.65)" : "0.18)") }}
        animate={active ? { scaleY: [0.15, 1, 0.35, 0.8, 0.15], opacity: [0.4, 0.9, 0.5, 0.75, 0.4] } : { scaleY: 0.12, opacity: 0.18 }}
        transition={{ duration: 0.45 + (i * 0.055) % 0.4, repeat: active ? Infinity : 0, ease: "easeInOut", delay: (i * 0.035) % 0.28 }}
      />
    ))}
  </div>
);

/* ── Holographic corner bracket ───────────────────────────────────── */
const HudBracket = ({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) => (
  <span
    className="absolute pointer-events-none"
    style={{
      width: 10, height: 10,
      top:    pos.startsWith("t") ? 0 : "auto",
      bottom: pos.startsWith("b") ? 0 : "auto",
      left:   pos.endsWith("l")   ? 0 : "auto",
      right:  pos.endsWith("r")   ? 0 : "auto",
      borderTop:    pos.startsWith("t") ? "1.5px solid rgba(0,200,255,0.6)" : "none",
      borderBottom: pos.startsWith("b") ? "1.5px solid rgba(0,200,255,0.6)" : "none",
      borderLeft:   pos.endsWith("l")   ? "1.5px solid rgba(0,200,255,0.6)" : "none",
      borderRight:  pos.endsWith("r")   ? "1.5px solid rgba(0,200,255,0.6)" : "none",
    }}
  />
);

type UserProfile = {
  name: string | null;
  bio: string | null;
  company: string | null;
  role: string | null;
  industry: string | null;
  services: string | null;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-stt`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;
const ELEVENLABS_TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: ActionResult[];
};

type ActionResult = {
  type: string;
  title: string;
  success: boolean;
};

// --- Action Cards ---
const ChatActionCards = ({ actions }: { actions: ActionResult[] }) => {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; barColor: string }> = {
    task:    { icon: CheckSquare, color: "text-[hsl(var(--nectar-green))]",  bg: "bg-[hsl(var(--nectar-green))]/5",  border: "border-[hsl(var(--nectar-green))]/20",  barColor: "hsl(var(--nectar-green))" },
    habit:   { icon: Flame,       color: "text-[hsl(var(--nectar-orange))]", bg: "bg-[hsl(var(--nectar-orange))]/5", border: "border-[hsl(var(--nectar-orange))]/20", barColor: "hsl(var(--nectar-orange))" },
    finance: { icon: DollarSign,  color: "text-primary",                     bg: "bg-primary/5",                     border: "border-primary/20",                     barColor: "hsl(var(--primary))" },
    reminder:{ icon: Bell,        color: "text-[hsl(var(--nectar-orange))]", bg: "bg-[hsl(var(--nectar-orange))]/5", border: "border-[hsl(var(--nectar-orange))]/20", barColor: "hsl(var(--nectar-orange))" },
    project: { icon: CheckSquare, color: "text-[hsl(var(--nectar-purple))]", bg: "bg-[hsl(var(--nectar-purple))]/5", border: "border-[hsl(var(--nectar-purple))]/20", barColor: "hsl(var(--nectar-purple))" },
    email:   { icon: Send,        color: "text-destructive",                 bg: "bg-destructive/5",                 border: "border-destructive/20",                 barColor: "hsl(var(--destructive))" },
    calendar:{ icon: Calendar,    color: "text-[hsl(var(--cyan))]",          bg: "bg-[hsl(var(--cyan))]/5",          border: "border-[hsl(var(--cyan))]/20",          barColor: "hsl(var(--cyan))" },
    note:    { icon: CheckSquare, color: "text-[hsl(var(--nectar-purple))]", bg: "bg-[hsl(var(--nectar-purple))]/5", border: "border-[hsl(var(--nectar-purple))]/20", barColor: "hsl(var(--nectar-purple))" },
  };

  return (
    <div className="space-y-1.5 mt-2">
      {actions.map((a, j) => {
        const cfg = actionConfig[a.type] || actionConfig.task;
        const ActionIcon = cfg.icon;
        const checked = checkedItems.has(j);
        return (
          <motion.div
            key={j}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: j * 0.1 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
              cfg.bg, cfg.border,
              checked && "opacity-60"
            )}
            style={{ borderLeftWidth: 4, borderLeftColor: cfg.barColor }}
            onClick={() => toggleCheck(j)}
          >
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
              <ActionIcon className={cn("w-4 h-4", cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", checked && "line-through text-muted-foreground")}>{a.title}</p>
              <p className={cn("text-[10px] capitalize", cfg.color)}>{a.success ? "✓ Criado" : "✗ Erro"}</p>
            </div>
            <div className={cn(
              "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
              checked ? "bg-[hsl(var(--nectar-green))] border-[hsl(var(--nectar-green))]" : "border-border/60 hover:border-primary"
            )}>
              {checked && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// --- Hook: responsive globe size ---
function useGlobeSize() {
  const [size, setSize] = useState(() => {
    if (typeof window === "undefined") return 320;
    return Math.min(340, Math.min(window.innerWidth * 0.68, window.innerHeight * 0.48));
  });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setSize(Math.min(340, Math.min(window.innerWidth * 0.68, window.innerHeight * 0.48)));
      }, 150);
    };
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); clearTimeout(timer); };
  }, []);
  return size;
}

// --- Main ChatView ---
export const ChatView = ({ onNavigate }: { onNavigate?: (view: AppView) => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showProgressCards, setShowProgressCards] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAssistantTextRef = useRef<string>("");
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useAISettings();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const globeSize = useGlobeSize();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, bio, company, role, industry, services")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setUserProfile(data as UserProfile); });
  }, [user]);

  // Load conversation history
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoadingHistory(true);
      try {
        const { data: convos } = await supabase
          .from("chat_conversations")
          .select("id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        let convId: string;
        if (convos && convos.length > 0) {
          convId = convos[0].id;
        } else {
          const { data: newConvo } = await supabase
            .from("chat_conversations")
            .insert({ user_id: user.id, title: "Conversa principal" })
            .select("id")
            .single();
          convId = newConvo!.id;
        }
        setConversationId(convId);

        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("role, content, actions")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true });

        if (msgs) setMessages(msgs.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          actions: m.actions as ActionResult[] | undefined
        })));
      } catch (e) { console.error(e); }
      finally { setIsLoadingHistory(false); }
    };
    load();
  }, [user]);

  // Audio + mic stream cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (pendingAudioRef.current) { pendingAudioRef.current.pause(); pendingAudioRef.current = null; }
      // Always release the mic stream so iOS doesn't show the orange dot indefinitely
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
        activeStreamRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || !user || !conversationId) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          message: text,
          conversationId,
          userId: user.id,
          profile: userProfile,
          settings: {
            assistantName: settings.assistantName,
            voiceEnabled: settings.voiceEnabled,
            voiceProvider: settings.voiceProvider,
            voiceId: settings.voiceId
          }
        }
      });

      if (error) throw error;

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response,
        actions: data.actions
      };
      setMessages(prev => [...prev, assistantMsg]);
      lastAssistantTextRef.current = data.response;

      if (settings.voiceEnabled) {
        speak(data.response);
      }

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["finances"] });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao enviar mensagem", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const speak = async (text: string) => {
    if (!text || !settings.voiceEnabled) return;
    setIsSpeaking(true);

    try {
      const url = settings.voiceProvider === "elevenlabs" ? ELEVENLABS_TTS_URL : TTS_URL;
      const { data, error } = await supabase.functions.invoke(url.split("/").pop()!, {
        body: {
          text: text.replace(/[*#_`~\[\]()>]/g, ""),
          voiceId: settings.voiceId
        }
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.play();
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Track the active media stream so we can always release it
  const activeStreamRef = useRef<MediaStream | null>(null);

  const releaseStream = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (typeof MediaRecorder === "undefined") {
      toast({ title: "Erro", description: "Gravação de áudio não suportada neste navegador", variant: "destructive" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;

      // Priority order: webm (Chrome/Firefox desktop), mp4 (iOS Safari), aac (iOS fallback), default
      const mimeType = ["audio/webm", "audio/mp4", "audio/aac", "audio/mpeg"]
        .find(t => MediaRecorder.isTypeSupported(t)) ?? "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType || "audio/mp4";
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        releaseStream();
        transcribe(audioBlob);
      };

      // timeslice of 250 ms is required on iOS Safari so ondataavailable fires
      recorder.start(250);
      setIsListening(true);
    } catch (e) {
      console.error(e);
      releaseStream();
      const msg = (e instanceof DOMException && e.name === "NotAllowedError")
        ? "Permissão de microfone negada. Verifique as configurações do navegador."
        : "Não foi possível acessar o microfone";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && isListening) {
      // On iOS, calling stop() while state is 'inactive' throws — guard it
      if (recorder.state !== "inactive") {
        recorder.stop();
      } else {
        releaseStream();
      }
      setIsListening(false);
    }
  };

  // Wrap FileReader in a Promise so try/catch and finally work correctly
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const transcribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const { data, error } = await supabase.functions.invoke("gemini-stt", {
        body: { audio: base64, mimeType: blob.type }
      });

      if (error) throw error;
      if (data?.text) {
        setLiveTranscript(data.text);
        handleSend(data.text);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao transcrever áudio", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearChat = async () => {
    if (!conversationId || !user) return;
    try {
      await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
      setMessages([]);
      toast({ title: "Chat limpo", description: "Histórico de mensagens removido" });
    } catch (e) { console.error(e); }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    toast({ title: "Arquivos selecionados", description: `${files.length} arquivo(s) prontos para processamento (funcionalidade em breve)` });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const assistantName = settings.assistantName || "Horus";
  const lastAiMessage = [...messages].reverse().find(m => m.role === "assistant");
  const lastAiText = lastAiMessage?.content
    ? lastAiMessage.content.replace(/[*#_`~\[\]()>]/g, "").slice(0, 220)
    : null;

  const isBusy = isLoading || isTranscribing;
  const statusLabel = isBusy
    ? (isTranscribing ? "TRANSCREVENDO" : "PROCESSANDO")
    : isListening
    ? "OUVINDO"
    : isSpeaking
    ? "FALANDO"
    : "PRONTO";

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#020d14]">
        <HorusConstellation isThinking isSpeaking={false} size={globeSize} />
        <p className="mt-6 text-xs font-mono tracking-widest text-cyan-400/60 uppercase">Inicializando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden select-none" style={{ background: "#020c14" }}>

      {/* ── Deep-space background ───────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial core glow */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 55% at 50% 48%, rgba(0,70,110,0.22) 0%, transparent 70%)" }} />
        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(0,200,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,1) 1px,transparent 1px)", backgroundSize: "52px 52px" }} />
        {/* Horizontal scan line animation — desktop only */}
        {!isMobile && (
          <motion.div
            className="absolute left-0 right-0 h-[1px] bg-cyan-400/20 z-0"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* ── Top bar: status & actions ───────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-cyan-400/10 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn("w-2 h-2 rounded-full", isBusy ? "bg-amber-400 animate-pulse" : "bg-cyan-400")} />
            <div className={cn("absolute inset-0 rounded-full blur-[4px]", isBusy ? "bg-amber-400/60" : "bg-cyan-400/60")} />
          </div>
          <span className="text-[10px] font-mono tracking-[0.2em] text-cyan-400/70 uppercase">{assistantName} // ONLINE</span>
        </div>

        <div className="flex items-center gap-2">
          {lastAiText && (
            <button
              onClick={() => speak(lastAiMessage!.content)}
              disabled={isSpeaking || isBusy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-mono tracking-wider uppercase transition-all"
              style={{ borderColor: "rgba(0,200,255,0.22)", background: "rgba(0,200,255,0.05)", color: "rgba(0,200,255,0.55)" }}>
              <Volume2 className="w-3 h-3" /> Repetir
            </button>
          )}
          <button onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-mono tracking-wider uppercase transition-all hover:border-red-400/30 hover:text-red-400/60"
            style={{ borderColor: "rgba(0,200,255,0.12)", background: "transparent", color: "rgba(0,200,255,0.32)" }}>
            <Trash2 className="w-3 h-3" /> Limpar
          </button>
        </div>
      </div>

      {/* ── Globe + transcription ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 gap-0 overflow-hidden">

        {/* Globe with scale animation */}
        <motion.div
          animate={isSpeaking
            ? { scale: [1, 1.035, 1], transition: { repeat: Infinity, duration: 1.7, ease: "easeInOut" } }
            : isListening
            ? { scale: [1, 1.012, 1], transition: { repeat: Infinity, duration: 1.1, ease: "easeInOut" } }
            : { scale: 1 }}
        >
          <HorusConstellation isThinking={isBusy} isSpeaking={isSpeaking} size={globeSize} />
        </motion.div>

        {/* ── Status + audio bars row ──────────────────────────────────── */}
        <div className="flex items-center gap-3 mt-1">
          <AnimateKey id={statusLabel}>
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase" style={{ color: "rgba(0,200,255,0.55)" }}>
              {statusLabel}
            </span>
          </AnimateKey>
          <AudioBars active={isSpeaking || isListening} />
        </div>

        {/* ── Real-time text display ─────────────────────────────────────── */}
        <div className="mt-8 w-full max-w-xl text-center min-h-[100px] flex flex-col items-center justify-start px-4">
          <AnimatePresence mode="wait">
            {isListening && (
              <motion.p
                key="listening"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-cyan-400/40 font-mono text-xs italic tracking-wider">
                Capturando áudio...
              </motion.p>
            )}

            {!isListening && isTranscribing && (
              <motion.p
                key="transcribing"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-cyan-400/60 font-mono text-xs animate-pulse tracking-widest uppercase">
                Processando linguagem...
              </motion.p>
            )}

            {!isBusy && !isListening && lastAiMessage && (
              <motion.div
                key={lastAiMessage.content}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-cyan-100/90 font-light text-lg sm:text-xl leading-relaxed tracking-tight">
                  <TypewriterText text={lastAiMessage.content} />
                </div>
                {lastAiMessage.actions && lastAiMessage.actions.length > 0 && (
                  <div className="w-full max-w-sm mx-auto">
                    <ChatActionCards actions={lastAiMessage.actions} />
                  </div>
                )}
              </motion.div>
            )}

            {!isBusy && !isListening && !lastAiMessage && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-cyan-400/30 font-mono text-[11px] tracking-[0.4em] uppercase"
              >
                Sistema aguardando comando
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom mic controls ──────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 flex flex-col items-center pb-8 pt-3 gap-3">

        {/* Mic button */}
        <div className="relative flex items-center justify-center">
          {isListening && (
            <>
              <motion.span className="absolute rounded-full border border-cyan-400/35"
                style={{ width: 76, height: 76 }}
                animate={{ scale: [1, 1.65, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
              <motion.span className="absolute rounded-full border border-cyan-400/20"
                style={{ width: 76, height: 76 }}
                animate={{ scale: [1, 2.1, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.38 }} />
            </>
          )}
          <button
            onClick={toggleVoice}
            disabled={isBusy}
            className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none",
              isListening
                ? "border-2 border-cyan-400/90 text-cyan-300"
                : isBusy
                ? "border border-cyan-400/12 text-cyan-400/22 cursor-not-allowed"
                : "border border-cyan-400/30 text-cyan-400/65 hover:text-cyan-300 hover:border-cyan-400/65"
            )}
            style={{
              background: isListening
                ? "radial-gradient(circle, rgba(0,200,255,0.18) 0%, rgba(0,200,255,0.06) 100%)"
                : "rgba(0,200,255,0.04)",
              boxShadow: isListening ? "0 0 30px 6px rgba(0,200,255,0.30)" : undefined,
            }}
          >
            {isListening ? <MicOff className="w-5 h-5" />
              : isBusy ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Mic className="w-5 h-5" />}
          </button>
        </div>

        <span className="text-[9px] font-mono tracking-[0.3em] uppercase select-none"
          style={{ color: "rgba(0,200,255,0.30)" }}>
          {isListening ? "Clique para enviar" : isBusy ? "Aguarde..." : "Clique para falar"}
        </span>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
        multiple className="hidden" onChange={handleFileAttach} />
    </div>
  );
};

/* ── Tiny helper: animate on key change ─────────────────────────── */
const AnimateKey = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <AnimatePresence mode="wait">
    <motion.span key={id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {children}
    </motion.span>
  </AnimatePresence>
);
