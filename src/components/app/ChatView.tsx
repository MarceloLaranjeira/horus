import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Loader2, CheckCircle2, CheckSquare, DollarSign, Flame, Bell, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useAISettings } from "@/hooks/useAISettings";
import { HorusConstellation, SmallConstellation } from "@/components/app/HorusConstellation";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

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





export const ChatView = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useAISettings();

  // Load conversation
  useEffect(() => {
    if (!user) return;
    const loadConversation = async () => {
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
          .select("role, content")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: true });

        if (msgs && msgs.length > 0) {
          setMessages(msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
        } else {
          setMessages([]);
        }
      } catch (e) {
        console.error("Error loading conversation:", e);
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadConversation();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);


  const saveMessage = useCallback(async (role: string, content: string) => {
    if (!user || !conversationId) return;
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
    });
    await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  }, [user, conversationId]);

  const executeActions = async (toolCalls: any[]): Promise<ActionResult[]> => {
    const results: ActionResult[] = [];
    const gmailUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail`;
    const calendarUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-google-calendar`;
    const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;

    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.function.arguments);
        const name = call.function.name;
        if (name === "create_task" && user) {
          const { error } = await supabase.from("tasks").insert({ title: args.title, priority: args.priority || "medium", due_date: args.due_date || null, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["tasks"] }); results.push({ type: "task", title: args.title, success: true }); }
        } else if (name === "create_habit" && user) {
          const { error } = await supabase.from("habits").insert({ name: args.name, icon: args.icon || "🎯", target_days_per_week: args.target_days_per_week || 7, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["habits"] }); results.push({ type: "habit", title: args.name, success: true }); }
        } else if (name === "add_finance" && user) {
          const { error } = await supabase.from("finances").insert({ description: args.description, amount: args.amount, type: args.type, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["finances"] }); results.push({ type: "finance", title: args.description, success: true }); }
        } else if (name === "create_reminder" && user) {
          const { error } = await supabase.from("reminders").insert({ title: args.title, due_date: args.due_date, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["reminders"] }); results.push({ type: "reminder", title: args.title, success: true }); }
        } else if (name === "list_calendar_events") {
          const token = await getToken();
          const days = args.days || 7;
          const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
          const res = await fetch(calendarUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: "list_events", timeMax, maxResults: args.maxResults || 10 }),
          });
          const data = await res.json();
          if (data.success && data.events) {
            const summary = data.events.map((e: any) => {
              const start = e.start?.dateTime || e.start?.date || "";
              return `• ${e.summary} — ${start}`;
            }).join("\n");
            results.push({ type: "calendar", title: `${data.events.length} evento(s):\n${summary}`, success: true });
          } else {
            results.push({ type: "calendar", title: data.error || "Erro ao listar eventos", success: false });
          }
        } else if (name === "create_calendar_event") {
          const token = await getToken();
          const res = await fetch(calendarUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: "create_event", summary: args.summary, description: args.description, start: args.start, end: args.end, location: args.location }),
          });
          const data = await res.json();
          if (data.success) {
            results.push({ type: "calendar", title: `Evento "${args.summary}" criado!`, success: true });
          } else {
            results.push({ type: "calendar", title: data.error || "Erro ao criar evento", success: false });
          }
        } else if (name === "list_emails") {
          const res = await fetch(gmailUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
            body: JSON.stringify({ action: "list_emails", query: args.query || "in:inbox", maxResults: args.maxResults || 5 }),
          });
          const data = await res.json();
          if (data.success && data.emails) {
            const summary = data.emails.map((e: any) => `• ${e.subject} — de: ${e.from}${e.isUnread ? " 🔵" : ""}`).join("\n");
            results.push({ type: "email", title: `${data.emails.length} emails encontrados:\n${summary}`, success: true });
          } else {
            results.push({ type: "email", title: data.error || "Erro ao listar emails", success: false });
          }
        } else if (name === "read_email") {
          const res = await fetch(gmailUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
            body: JSON.stringify({ action: "read_email", messageId: args.messageId }),
          });
          const data = await res.json();
          if (data.success && data.email) {
            results.push({ type: "email", title: `Lido: "${data.email.subject}" de ${data.email.from}`, success: true });
          } else {
            results.push({ type: "email", title: data.error || "Erro ao ler email", success: false });
          }
        } else if (name === "send_email") {
          const res = await fetch(gmailUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${await getToken()}` },
            body: JSON.stringify({ action: "send_email", to: args.to, subject: args.subject, body: args.body }),
          });
          const data = await res.json();
          if (data.success) {
            results.push({ type: "email", title: `Email enviado para ${args.to}`, success: true });
          } else {
            results.push({ type: "email", title: data.error || "Erro ao enviar email", success: false });
          }
        }
      } catch (e) { console.error("Action error:", e); }
    }
    return results;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLiveTranscript("");
    setIsLoading(true);

    await saveMessage("user", text);

    const apiMessages = updatedMessages.slice(-50).map((m) => ({ role: m.role, content: m.content }));

    try {
      // Action extraction
      const actionResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: apiMessages, mode: "actions", model: settings.model, assistantName: settings.assistantName, customPrompt: settings.customPrompt, temperature: settings.temperature, mood: settings.mood }),
      });
      let actionResults: ActionResult[] = [];
      if (actionResp.ok) {
        const actionData = await actionResp.json();
        const toolCalls = actionData.choices?.[0]?.message?.tool_calls;
        if (toolCalls?.length) actionResults = await executeActions(toolCalls);
      }

      // Streaming chat
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          messages: apiMessages,
          mode: "chat",
          model: settings.model,
          assistantName: settings.assistantName,
          customPrompt: settings.customPrompt,
          temperature: settings.temperature,
          mood: settings.mood,
          executedActions: actionResults.length > 0 ? actionResults.map((a) => `${a.type}: "${a.title}" criado com sucesso`) : undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }
      if (!resp.body) throw new Error("Stream não disponível");

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > updatedMessages.length) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar, actions: actionResults.length > 0 ? actionResults : undefined } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar, actions: actionResults.length > 0 ? actionResults : undefined }];
        });
      };

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      if (assistantSoFar) {
        await saveMessage("assistant", assistantSoFar);
        playTTS(assistantSoFar);
      }
    } catch (e: any) {
      console.error("Chat error:", e);
      toast({ title: "Erro no chat", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input.trim());

  const playTTS = async (text: string) => {
    setIsSpeaking(true);
    try {
      const cleanText = text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 3000);
      if (!cleanText.trim()) { setIsSpeaking(false); return; }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text: cleanText, voiceId: settings.ttsVoiceId }),
      });
      if (!response.ok) { setIsSpeaking(false); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Voz não suportada neste navegador.", variant: "destructive" });
      return;
    }
    if (isListening) {
      // Stop recording and send accumulated transcript
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        setLiveTranscript("");
        sendMessage(finalText);
      } else {
        setLiveTranscript("");
      }
      transcriptRef.current = "";
      return;
    }
    // Start recording
    setIsListening(true);
    setLiveTranscript("");
    transcriptRef.current = "";
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = settings.voiceLang || "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event: any) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      transcriptRef.current = full;
      setLiveTranscript(full);
    };
    recognition.onerror = () => { setIsListening(false); setLiveTranscript(""); transcriptRef.current = ""; };
    recognition.onend = () => {
      // If still listening (browser auto-stopped), restart
      if (isListening && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const clearChat = async () => {
    if (!user || !conversationId) return;
    await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
    setMessages([]);
    toast({ title: "Chat limpo com sucesso!" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };



  const assistantName = settings.assistantName || "Horus";
  const lastMessage = messages[messages.length - 1];
  const showGlobeCenter = messages.length === 0 || (isLoading && lastMessage?.role === "user");

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center jarvis-grid">
        <HorusConstellation isThinking={true} isSpeaking={false} />
        <p className="text-sm text-muted-foreground mt-6">Carregando conversa...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full jarvis-grid relative">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Globe + status area */}
        <AnimatePresence mode="wait">
          {showGlobeCenter ? (
            <motion.div
              key="globe-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-8 shrink-0"
            >
              <HorusConstellation isThinking={isLoading} isSpeaking={isSpeaking} />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground mt-6"
              >
                {isLoading ? "Processando..." : isListening ? "Ouvindo..." : isSpeaking ? "Falando..." : `${assistantName} · Pronto`}
              </motion.p>
              {liveTranscript && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-primary/80 mt-2 italic max-w-md text-center"
                >
                  "{liveTranscript}"
                </motion.p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="globe-mini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4 px-6 py-3 border-b border-border/30 bg-card/30 backdrop-blur-sm shrink-0"
            >
              <SmallConstellation isThinking={isLoading || isSpeaking} />
              <div className="flex-1">
                <h2 className="font-semibold text-sm text-gradient-cyan">{assistantName}</h2>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? "Processando..." : isListening ? "Ouvindo..." : isSpeaking ? "Falando..." : settings.model.split("/")[1] || settings.model}
                </p>
              </div>
              {liveTranscript && (
                <p className="text-xs text-primary/70 italic truncate max-w-[200px]">"{liveTranscript}"</p>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8"
                title="Excluir chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages + Menus area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat messages */}
          <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && <SmallConstellation isThinking={false} />}
                    <div className="max-w-[80%] space-y-2">
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-primary/15 border border-primary/30 text-foreground rounded-br-md"
                          : "bg-card/80 border border-border/50 rounded-bl-md backdrop-blur-sm"
                      )}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-primary prose-headings:text-primary">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="space-y-1.5 mt-1">
                          {msg.actions.map((a, j) => {
                            const actionConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
                              task: { icon: CheckSquare, color: "text-[hsl(var(--nectar-green))]", bg: "bg-[hsl(var(--nectar-green))]/5", border: "border-[hsl(var(--nectar-green))]/20" },
                              habit: { icon: Flame, color: "text-[hsl(var(--nectar-orange,25_95%_53%))]", bg: "bg-[hsl(var(--nectar-orange))]/5", border: "border-[hsl(var(--nectar-orange))]/20" },
                              finance: { icon: DollarSign, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
                              reminder: { icon: Bell, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" },
                              email: { icon: Send, color: "text-[hsl(0_80%_60%)]", bg: "bg-[hsl(0_80%_60%)]/5", border: "border-[hsl(0_80%_60%)]/20" },
                              calendar: { icon: Calendar, color: "text-[hsl(187_100%_50%)]", bg: "bg-[hsl(187_100%_50%)]/5", border: "border-[hsl(187_100%_50%)]/20" },
                            };
                            const cfg = actionConfig[a.type] || { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" };
                            const ActionIcon = cfg.icon;
                            return (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: j * 0.1 }}
                                className={cn("flex items-center gap-3 p-3 rounded-xl border", cfg.bg, cfg.border)}
                              >
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                                  <ActionIcon className={cn("w-4 h-4", cfg.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{a.title}</p>
                                  <p className={cn("text-[10px] capitalize", cfg.color)}>{a.success ? "✓ Criado" : "✗ Erro"}</p>
                                </div>
                                {a.success && <CheckCircle2 className={cn("w-4 h-4 shrink-0", cfg.color)} />}
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && lastMessage?.role === "user" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                  <SmallConstellation isThinking={true} />
                  <div className="bg-card/80 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 backdrop-blur-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

        </div>
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-border/30 bg-card/20 backdrop-blur-sm relative z-10">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Fale com o ${assistantName}...`}
              className="min-h-[44px] max-h-[120px] resize-none bg-secondary/50 border-border/50 focus:border-primary/50 focus:shadow-[0_0_15px_-5px_hsl(var(--cyan)/0.3)] transition-shadow pr-2"
              rows={1}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={cn(
              "shrink-0 transition-all h-11 w-11 rounded-xl",
              isListening
                ? "text-destructive bg-destructive/10 animate-pulse shadow-[0_0_20px_-3px_hsl(0_84%_60%/0.5)]"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 glow-cyan bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-11 rounded-xl"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
