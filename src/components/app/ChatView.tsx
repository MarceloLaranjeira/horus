import { useState, useRef, useEffect, useMemo } from "react";
import { Send, Mic, MicOff, Loader2, CheckCircle2 } from "lucide-react";
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

/** Enhanced Jarvis Globe with particles and scan-line */
const AuraGlobe = ({ isThinking, size = "sm" }: { isThinking: boolean; size?: "sm" | "lg" }) => {
  const dim = size === "lg" ? "w-20 h-20" : "w-10 h-10";
  const particles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * 360,
      delay: i * 0.3,
      radius: size === "lg" ? 36 : 18,
    })), [size]);

  return (
    <div className={cn("relative shrink-0", dim)}>
      {/* Particles orbiting */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute inset-0"
          style={{
            animation: `arc-spin ${6 + p.id * 0.5}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        >
          <div
            className={cn(
              "absolute rounded-full bg-primary",
              size === "lg" ? "w-1.5 h-1.5" : "w-1 h-1",
              isThinking ? "opacity-90" : "opacity-40"
            )}
            style={{
              top: "0%",
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: isThinking
                ? "0 0 6px 1px hsl(var(--cyan) / 0.6)"
                : "0 0 3px 0px hsl(var(--cyan) / 0.3)",
            }}
          />
        </div>
      ))}

      {/* Outer ring */}
      <div className={cn(
        "absolute inset-0 rounded-full border border-primary/40",
        isThinking ? "animate-arc-spin" : "animate-globe-rotate"
      )} />
      {/* Dashed middle ring */}
      <div className={cn(
        "absolute rounded-full border border-dashed border-primary/20",
        size === "lg" ? "inset-2" : "inset-1",
        isThinking ? "animate-arc-spin-reverse" : ""
      )} />
      {/* Scan-line effect */}
      <div className={cn(
        "absolute inset-0 rounded-full overflow-hidden",
        isThinking && "animate-globe-pulse"
      )}>
        <div
          className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
          style={{
            animation: "scanline 2s ease-in-out infinite",
            top: "50%",
          }}
        />
      </div>
      {/* Core glow */}
      <div className={cn(
        "absolute rounded-full bg-primary/15 flex items-center justify-center",
        size === "lg" ? "inset-4" : "inset-2"
      )}>
        <div
          className={cn(
            "rounded-full bg-primary/50",
            size === "lg" ? "w-5 h-5" : "w-3 h-3"
          )}
          style={{
            boxShadow: isThinking
              ? "0 0 15px 4px hsl(var(--cyan) / 0.6), 0 0 30px 8px hsl(var(--cyan) / 0.2)"
              : "0 0 10px 2px hsl(var(--cyan) / 0.4)",
          }}
        />
      </div>
      {/* Outer ambient glow */}
      <div className={cn(
        "absolute rounded-full bg-primary/5 blur-md",
        size === "lg" ? "-inset-3" : "-inset-1"
      )} />
    </div>
  );
};

export const ChatView = () => {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Olá! 👋 Eu sou o **AuraTask**, seu assistente pessoal com IA. Posso te ajudar a organizar tarefas, hábitos, finanças, lembretes e muito mais.\n\nExperimente dizer algo como:\n- *\"Crie uma tarefa para terminar o relatório até sexta\"*\n- *\"Adicione R$ 50 como despesa de almoço\"*\n- *\"Crie um hábito de meditar 15 min por dia\"*",
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useAISettings();

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const executeActions = async (toolCalls: any[]): Promise<ActionResult[]> => {
    const results: ActionResult[] = [];
    for (const call of toolCalls) {
      try {
        const args = JSON.parse(call.function.arguments);
        const name = call.function.name;

        if (name === "create_task" && user) {
          const { error } = await supabase.from("tasks").insert({
            title: args.title,
            priority: args.priority || "medium",
            due_date: args.due_date || null,
            user_id: user.id,
          });
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            results.push({ type: "task", title: args.title, success: true });
          }
        } else if (name === "create_habit" && user) {
          const { error } = await supabase.from("habits").insert({
            name: args.name,
            icon: args.icon || "🎯",
            target_days_per_week: args.target_days_per_week || 7,
            user_id: user.id,
          });
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ["habits"] });
            results.push({ type: "habit", title: args.name, success: true });
          }
        } else if (name === "add_finance" && user) {
          const { error } = await supabase.from("finances").insert({
            description: args.description,
            amount: args.amount,
            type: args.type,
            user_id: user.id,
          });
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ["finances"] });
            results.push({ type: "finance", title: args.description, success: true });
          }
        } else if (name === "create_reminder" && user) {
          const { error } = await supabase.from("reminders").insert({
            title: args.title,
            due_date: args.due_date,
            user_id: user.id,
          });
          if (!error) {
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
            results.push({ type: "reminder", title: args.title, success: true });
          }
        }
      } catch (e) {
        console.error("Action error:", e);
      }
    }
    return results;
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      // First: non-streaming call to check for tool calls
      const actionResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: "actions",
          model: settings.model,
          assistantName: settings.assistantName,
        }),
      });

      let actionResults: ActionResult[] = [];
      if (actionResp.ok) {
        const actionData = await actionResp.json();
        const toolCalls = actionData.choices?.[0]?.message?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          actionResults = await executeActions(toolCalls);
        }
      }

      // Second: streaming call for the response
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          mode: "chat",
          model: settings.model,
          assistantName: settings.assistantName,
          executedActions: actionResults.length > 0
            ? actionResults.map((a) => `${a.type}: "${a.title}" criado com sucesso`)
            : undefined,
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
      // Play TTS for the final response
      if (assistantSoFar) playTTS(assistantSoFar);
    } catch (e: any) {
      console.error("Chat error:", e);
      toast({ title: "Erro no chat", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFromVoice = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput("");
    // Small delay to let state update, then call handleSend logic directly
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const actionResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: apiMessages, mode: "actions", model: settings.model, assistantName: settings.assistantName }),
      });
      let actionResults: ActionResult[] = [];
      if (actionResp.ok) {
        const actionData = await actionResp.json();
        const toolCalls = actionData.choices?.[0]?.message?.tool_calls;
        if (toolCalls?.length) actionResults = await executeActions(toolCalls);
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: apiMessages, mode: "chat", model: settings.model, assistantName: settings.assistantName, executedActions: actionResults.length > 0 ? actionResults.map((a) => `${a.type}: "${a.title}" criado com sucesso`) : undefined }),
      });

      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
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
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
      // Play TTS for the complete response
      if (assistantSoFar) playTTS(assistantSoFar);
    } catch (e: any) {
      console.error("Chat error:", e);
      toast({ title: "Erro no chat", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    if (!settings.ttsEnabled) return;
    try {
      const cleanText = text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 3000);
      if (!cleanText.trim()) return;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: cleanText, voiceId: settings.ttsVoiceId }),
        }
      );
      if (!response.ok) return;
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      console.error("TTS error:", e);
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast({ title: "Voz não suportada neste navegador.", variant: "destructive" });
      return;
    }
    if (isListening) { setIsListening(false); return; }
    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = settings.voiceLang || "pt-BR";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleSendFromVoice(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const assistantName = settings.assistantName || "AuraTask";

  return (
    <div className="flex flex-col h-full jarvis-grid">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-4 bg-card/50 backdrop-blur-sm">
        <AuraGlobe isThinking={isLoading} />
        <div>
          <h2 className="font-semibold text-sm text-gradient-cyan">{assistantName} IA</h2>
          <p className="text-xs text-muted-foreground">Assistente pessoal · {settings.model.split("/")[1] || settings.model}</p>
        </div>
        {isLoading && (
          <div className="ml-auto flex items-center gap-2 text-xs text-primary/70">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Processando...
          </div>
        )}
      </div>

      {/* Messages */}
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
                {msg.role === "assistant" && <AuraGlobe isThinking={false} size="sm" />}
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary/15 border border-primary/30 text-foreground rounded-br-md"
                        : "bg-card border border-border/50 rounded-bl-md"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-primary prose-headings:text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {/* Action chips */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.actions.map((a, j) => (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: j * 0.1 }}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="capitalize">{a.type}:</span>
                          <span className="text-foreground/80">{a.title}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
              <AuraGlobe isThinking={true} />
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Input */}
      <div className="px-6 py-4 border-t border-border/50 bg-card/30 backdrop-blur-sm">
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
              "shrink-0 transition-all",
              isListening
                ? "text-destructive animate-pulse shadow-[0_0_15px_-3px_hsl(0_84%_60%/0.5)]"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 glow-cyan bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
