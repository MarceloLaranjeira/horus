import { useState, useRef, useEffect, useCallback } from "react";
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
const TypewriterText = ({ text, speed = 18 }: { text: string; speed?: number }) => {
  const [shown, setShown] = useState("");
  const [done, setDone]   = useState(false);
  useEffect(() => {
    setShown(""); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
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
const BAR_H = [4, 9, 16, 22, 14, 20, 10, 24, 16, 12, 20, 8, 18, 24, 10, 6, 14, 22, 8, 16];
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
    task: { icon: CheckSquare, color: "text-[hsl(var(--nectar-green))]", bg: "bg-[hsl(var(--nectar-green))]/5", border: "border-[hsl(var(--nectar-green))]/20", barColor: "hsl(var(--nectar-green))" },
    habit: { icon: Flame, color: "text-[hsl(var(--nectar-orange))]", bg: "bg-[hsl(var(--nectar-orange))]/5", border: "border-[hsl(var(--nectar-orange))]/20", barColor: "hsl(var(--nectar-orange))" },
    finance: { icon: DollarSign, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", barColor: "hsl(var(--primary))" },
    reminder: { icon: Bell, color: "text-[hsl(var(--nectar-orange))]", bg: "bg-[hsl(var(--nectar-orange))]/5", border: "border-[hsl(var(--nectar-orange))]/20", barColor: "hsl(var(--nectar-orange))" },
    project: { icon: CheckSquare, color: "text-[hsl(var(--nectar-purple))]", bg: "bg-[hsl(var(--nectar-purple))]/5", border: "border-[hsl(var(--nectar-purple))]/20", barColor: "hsl(var(--nectar-purple))" },
    email: { icon: Send, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", barColor: "hsl(var(--destructive))" },
    calendar: { icon: Calendar, color: "text-[hsl(var(--cyan))]", bg: "bg-[hsl(var(--cyan))]/5", border: "border-[hsl(var(--cyan))]/20", barColor: "hsl(var(--cyan))" },
    note: { icon: CheckSquare, color: "text-[hsl(var(--nectar-purple))]", bg: "bg-[hsl(var(--nectar-purple))]/5", border: "border-[hsl(var(--nectar-purple))]/20", barColor: "hsl(var(--nectar-purple))" },
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
              checked
                ? "bg-[hsl(var(--nectar-green))] border-[hsl(var(--nectar-green))]"
                : "border-border/60 hover:border-primary"
            )}>
              {checked && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};



export const ChatView = ({ onNavigate }: { onNavigate?: (view: AppView) => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showProgressCards, setShowProgressCards] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAssistantTextRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useAISettings();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Load user profile for AI context
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, bio, company, role, industry, services")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserProfile(data as UserProfile);
      });
  }, [user]);

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

        // Helper: find record by title (partial match) or ID
        const findByTitleOrId = async (table: string, titleField: string, titleArg?: string, idArg?: string): Promise<any> => {
          if (idArg) {
            const { data } = await supabase.from(table as any).select("*").eq("id", idArg).eq("user_id", user!.id).maybeSingle();
            return data as any;
          }
          if (titleArg) {
            const { data } = await supabase.from(table as any).select("*").eq("user_id", user!.id).ilike(titleField, `%${titleArg}%`).limit(1).maybeSingle();
            return data as any;
          }
          return null;
        };

        // === TASKS ===
        if (name === "create_task" && user) {
          const { error } = await supabase.from("tasks").insert({ title: args.title, description: args.description || null, priority: args.priority || "medium", due_date: args.due_date || null, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["tasks"] }); results.push({ type: "task", title: args.title, success: true }); }
        } else if (name === "update_task" && user) {
          const record = await findByTitleOrId("tasks", "title", args.task_title, args.task_id);
          if (record) {
            const updates: any = {};
            if (args.new_title) updates.title = args.new_title;
            if (args.description !== undefined) updates.description = args.description;
            if (args.priority) updates.priority = args.priority;
            if (args.status) { updates.status = args.status; if (args.status === "done") updates.completed_at = new Date().toISOString(); }
            if (args.due_date) updates.due_date = args.due_date;
            const { error } = await supabase.from("tasks").update(updates).eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["tasks"] }); results.push({ type: "task", title: `Tarefa "${record.title}" atualizada`, success: true }); }
          } else { results.push({ type: "task", title: "Tarefa não encontrada", success: false }); }
        } else if (name === "delete_task" && user) {
          const record = await findByTitleOrId("tasks", "title", args.task_title, args.task_id);
          if (record) {
            const { error } = await supabase.from("tasks").delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["tasks"] }); results.push({ type: "task", title: `Tarefa "${record.title}" excluída`, success: true }); }
          } else { results.push({ type: "task", title: "Tarefa não encontrada", success: false }); }
        } else if (name === "list_tasks" && user) {
          let query = supabase.from("tasks").select("title, status, priority, due_date").eq("user_id", user.id);
          if (args.status) query = query.eq("status", args.status);
          if (args.priority) query = query.eq("priority", args.priority);
          const { data } = await query.order("created_at", { ascending: false }).limit(args.limit || 10);
          if (data && data.length > 0) {
            const summary = data.map((t: any) => `• ${t.title} [${t.status}/${t.priority}]${t.due_date ? ` — ${t.due_date}` : ""}`).join("\n");
            results.push({ type: "task", title: `${data.length} tarefa(s):\n${summary}`, success: true });
          } else { results.push({ type: "task", title: "Nenhuma tarefa encontrada", success: true }); }
        }
        // === HABITS ===
        else if (name === "create_habit" && user) {
          const { error } = await supabase.from("habits").insert({ name: args.name, icon: args.icon || "🎯", target_days_per_week: args.target_days_per_week || 7, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["habits"] }); results.push({ type: "habit", title: args.name, success: true }); }
        } else if (name === "update_habit" && user) {
          const record = await findByTitleOrId("habits", "name", args.habit_name, args.habit_id);
          if (record) {
            const updates: any = {};
            if (args.new_name) updates.name = args.new_name;
            if (args.icon) updates.icon = args.icon;
            if (args.target_days_per_week !== undefined) updates.target_days_per_week = args.target_days_per_week;
            if (args.active !== undefined) updates.active = args.active;
            const { error } = await supabase.from("habits").update(updates).eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["habits"] }); results.push({ type: "habit", title: `Hábito "${record.name}" atualizado`, success: true }); }
          } else { results.push({ type: "habit", title: "Hábito não encontrado", success: false }); }
        } else if (name === "delete_habit" && user) {
          const record = await findByTitleOrId("habits", "name", args.habit_name, args.habit_id);
          if (record) {
            const { error } = await supabase.from("habits").delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["habits"] }); results.push({ type: "habit", title: `Hábito "${record.name}" excluído`, success: true }); }
          } else { results.push({ type: "habit", title: "Hábito não encontrado", success: false }); }
        }
        // === FINANCES ===
        else if (name === "add_finance" && user) {
          const { error } = await supabase.from("finances").insert({ description: args.description, amount: args.amount, type: args.type, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["finances"] }); results.push({ type: "finance", title: args.description, success: true }); }
        } else if (name === "delete_finance" && user) {
          const record = await findByTitleOrId("finances", "description", args.finance_description, args.finance_id);
          if (record) {
            const { error } = await supabase.from("finances").delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["finances"] }); results.push({ type: "finance", title: `Transação "${record.description}" excluída`, success: true }); }
          } else { results.push({ type: "finance", title: "Transação não encontrada", success: false }); }
        }
        // === REMINDERS ===
        else if (name === "create_reminder" && user) {
          const { error } = await supabase.from("reminders").insert({ title: args.title, description: args.description || null, due_date: args.due_date, user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["reminders"] }); results.push({ type: "reminder", title: args.title, success: true }); }
        } else if (name === "update_reminder" && user) {
          const record = await findByTitleOrId("reminders", "title", args.reminder_title, args.reminder_id);
          if (record) {
            const updates: any = {};
            if (args.new_title) updates.title = args.new_title;
            if (args.description !== undefined) updates.description = args.description;
            if (args.due_date) updates.due_date = args.due_date;
            if (args.completed !== undefined) updates.completed = args.completed;
            const { error } = await supabase.from("reminders").update(updates).eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["reminders"] }); results.push({ type: "reminder", title: `Lembrete "${record.title}" atualizado`, success: true }); }
          } else { results.push({ type: "reminder", title: "Lembrete não encontrado", success: false }); }
        } else if (name === "delete_reminder" && user) {
          const record = await findByTitleOrId("reminders", "title", args.reminder_title, args.reminder_id);
          if (record) {
            const { error } = await supabase.from("reminders").delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["reminders"] }); results.push({ type: "reminder", title: `Lembrete "${record.title}" excluído`, success: true }); }
          } else { results.push({ type: "reminder", title: "Lembrete não encontrado", success: false }); }
        }
        // === PROJECTS ===
        else if (name === "create_project" && user) {
          const { error } = await supabase.from("projects").insert({ title: args.title, description: args.description || null, status: args.status || "backlog", color: args.color || "#6366f1", user_id: user.id });
          if (!error) { queryClient.invalidateQueries({ queryKey: ["projects"] }); results.push({ type: "project", title: args.title, success: true }); }
        } else if (name === "update_project" && user) {
          const record = await findByTitleOrId("projects", "title", args.project_title, args.project_id);
          if (record) {
            const updates: any = {};
            if (args.new_title) updates.title = args.new_title;
            if (args.description !== undefined) updates.description = args.description;
            if (args.status) updates.status = args.status;
            if (args.color) updates.color = args.color;
            const { error } = await supabase.from("projects").update(updates).eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["projects"] }); results.push({ type: "project", title: `Projeto "${record.title}" atualizado`, success: true }); }
          } else { results.push({ type: "project", title: "Projeto não encontrado", success: false }); }
        } else if (name === "delete_project" && user) {
          const record = await findByTitleOrId("projects", "title", args.project_title, args.project_id);
          if (record) {
            const { error } = await supabase.from("projects").delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["projects"] }); results.push({ type: "project", title: `Projeto "${record.title}" excluído`, success: true }); }
          } else { results.push({ type: "project", title: "Projeto não encontrado", success: false }); }
        }
        // === NOTES ===
        else if (name === "create_note" && user) {
          const { error } = await supabase.from("notes" as any).insert({ title: args.title, content: args.content || "", user_id: user.id } as any);
          if (!error) { queryClient.invalidateQueries({ queryKey: ["notes"] }); results.push({ type: "note", title: args.title, success: true }); }
        } else if (name === "update_note" && user) {
          const record = await findByTitleOrId("notes", "title", args.note_title, args.note_id);
          if (record) {
            const updates: any = {};
            if (args.new_title) updates.title = args.new_title;
            if (args.content !== undefined) updates.content = args.content;
            const { error } = await supabase.from("notes" as any).update(updates as any).eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["notes"] }); results.push({ type: "note", title: `Nota "${record.title}" atualizada`, success: true }); }
          } else { results.push({ type: "note", title: "Nota não encontrada", success: false }); }
        } else if (name === "delete_note" && user) {
          const record = await findByTitleOrId("notes", "title", args.note_title, args.note_id);
          if (record) {
            const { error } = await supabase.from("notes" as any).delete().eq("id", record.id);
            if (!error) { queryClient.invalidateQueries({ queryKey: ["notes"] }); results.push({ type: "note", title: `Nota "${record.title}" excluída`, success: true }); }
          } else { results.push({ type: "note", title: "Nota não encontrada", success: false }); }
        }
        // === CALENDAR ===
        else if (name === "list_calendar_events") {
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

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Pre-unlock audio element ref for mobile TTS (must be created in user gesture)
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);

  const sendMessage = async (text: string) => {
    // Immediately unlock audio in user gesture context for mobile TTS
    if (settings.ttsEnabled) {
      const audio = new Audio();
      audio.preload = "auto";
      // Play silent audio to unlock autoplay on iOS/Android
      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
      pendingAudioRef.current = audio;
      console.log("[TTS] Audio element pre-unlocked in user gesture");
    }

    // Build message with file info
    let finalText = text.trim();
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(", ");
      finalText += `\n\n[Arquivos anexados: ${fileNames}]`;
      if (!finalText.replace(/\[Arquivos anexados:.*\]/, "").trim()) {
        finalText = `Criei uma tarefa a partir dos seguintes arquivos: ${fileNames}. Por favor, crie uma tarefa com base nos nomes dos arquivos.`;
      }
    }
    if (!finalText || isLoading) return;
    setAttachedFiles([]);
    const userMsg: Message = { role: "user", content: finalText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLiveTranscript("");
    setIsLoading(true);

    await saveMessage("user", text);

    // Check if user is asking about tasks/progress
    const progressKeywords = /\b(tarefa|tarefas|task|tasks|progresso|evolução|andamento|status|hábito|hábitos|habit|finanças|finance|lembrete|lembretes|reminder|projeto|projetos|project|resumo do dia|como estou|meu dia|pendente|pendentes|concluíd)/i;
    if (progressKeywords.test(text)) {
      setShowProgressCards(true);
    }

    const apiMessages = updatedMessages.slice(-50).map((m) => ({ role: m.role, content: m.content }));

    try {
      // Action extraction
      const actionResp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: apiMessages, mode: "actions", model: settings.model, assistantName: settings.assistantName, customPrompt: settings.customPrompt, temperature: settings.temperature, mood: settings.mood, userProfile }),
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
          userProfile,
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

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const playTTS = async (text: string) => {
    if (!settings.ttsEnabled) return;
    stopSpeaking(); // Stop any current speech first
    setIsSpeaking(true);
    lastAssistantTextRef.current = text;

    // Detect iOS/Safari for special handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOSSafari = isIOS && isSafari;
    console.log("[TTS] isIOSSafari:", isIOSSafari);

    // Reuse pre-unlocked audio element from user gesture, or create new one
    const hasPending = !!pendingAudioRef.current;
    const audio = pendingAudioRef.current || new Audio();
    pendingAudioRef.current = null;
    audio.preload = "auto";
    audioRef.current = audio;
    console.log("[TTS] Using", hasPending ? "pre-unlocked" : "new", "audio element");

    // On mobile, if we don't have a pre-unlocked element, try to unlock now
    // by playing a silent sound (may not work without gesture, but worth trying)
    if (!hasPending) {
      audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      try { await audio.play(); audio.pause(); audio.currentTime = 0; } catch { /* expected outside gesture */ }
    }

    try {
      const cleanText = text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 3000);
      if (!cleanText.trim()) { setIsSpeaking(false); audioRef.current = null; return; }

      const provider = settings.ttsProvider || "elevenlabs";
      const voiceId = settings.ttsVoiceId;
      console.log("[TTS] Provider:", provider, "| VoiceId:", voiceId, "| Text length:", cleanText.length);

      const playAudioBlob = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        audio.pause();
        audio.currentTime = 0;
        audio.src = url;
        audio.onended = () => { setIsSpeaking(false); audioRef.current = null; URL.revokeObjectURL(url); };
        audio.onerror = (e) => { console.error("[TTS] Audio error:", e); setIsSpeaking(false); audioRef.current = null; URL.revokeObjectURL(url); };
        audio.load();
        audio.play().catch((err) => {
          console.warn("[TTS] Play blocked, falling back to speechSynthesis:", err);
          URL.revokeObjectURL(url);
          // Fallback: use native speechSynthesis
          if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 500));
            utterance.lang = settings.voiceLang || "pt-BR";
            utterance.onend = () => { setIsSpeaking(false); };
            utterance.onerror = () => { setIsSpeaking(false); };
            window.speechSynthesis.speak(utterance);
          } else {
            setIsSpeaking(false);
          }
        });
      };

      if (provider === "elevenlabs") {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundo timeout
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ text: cleanText, voiceId, speed: settings.ttsSpeed }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            setIsSpeaking(false);
            try {
              const err = await response.json().catch(() => ({}));
              if (response.status === 401 || (err.error && err.error.includes("401"))) {
                toast({ title: "Cota do ElevenLabs esgotada", description: "Troque o provedor de voz para OpenAI ou Gemini nas configurações da IA.", variant: "destructive" });
              }
            } catch { /* ignore */ }
            return;
          }
          playAudioBlob(await response.blob());
        } catch (err: any) {
          if (err.name === "AbortError") {
            console.warn("[TTS] ElevenLabs timeout, falling back to speechSynthesis");
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 500));
              utterance.lang = settings.voiceLang || "pt-BR";
              utterance.onend = () => { setIsSpeaking(false); };
              utterance.onerror = () => { setIsSpeaking(false); };
              window.speechSynthesis.speak(utterance);
            } else {
              setIsSpeaking(false);
            }
          } else {
            throw err;
          }
        }
      } else if (provider === "openai" || provider === "gemini") {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: JSON.stringify({ text: cleanText, voiceId, provider, speed: settings.ttsSpeed }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            setIsSpeaking(false);
            const err = await response.json().catch(() => ({}));
            toast({ title: `Erro TTS ${provider}`, description: err.error || `Status ${response.status}`, variant: "destructive" });
            return;
          }
          playAudioBlob(await response.blob());
        } catch (err: any) {
          if (err.name === "AbortError") {
            console.warn(`[TTS] ${provider} timeout, falling back to speechSynthesis`);
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_`~\[\]()>]/g, "").substring(0, 500));
              utterance.lang = settings.voiceLang || "pt-BR";
              utterance.onend = () => { setIsSpeaking(false); };
              utterance.onerror = () => { setIsSpeaking(false); };
              window.speechSynthesis.speak(utterance);
            } else {
              setIsSpeaking(false);
            }
          } else {
            setIsSpeaking(false);
            toast({ title: `Erro TTS ${provider}`, description: err.message || "Erro desconhecido", variant: "destructive" });
          }
        }
      }
    } catch (e) {
      console.error("TTS error:", e);
      setIsSpeaking(false);
    }
  };

  const replayLastResponse = () => {
    if (lastAssistantTextRef.current) {
      playTTS(lastAssistantTextRef.current);
    }
  };

  const isListeningRef = useRef(false);

  const startRecognition = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({ title: "Voz não suportada neste navegador.", variant: "destructive" });
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    isListeningRef.current = true;
    setIsListening(true);
    setLiveTranscript("");
    transcriptRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = settings.voiceLang || "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = !isMobile;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let full = "";
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      transcriptRef.current = full;
      setLiveTranscript(full);
      console.log("[STT] Transcript:", full);
    };

    recognition.onerror = (e: any) => {
      console.log("[STT] Error:", e.error, "| isListening:", isListeningRef.current);

      // Em mobile, não reiniciar automaticamente fora de gesto do usuário
      if (!isMobile && (e.error === "no-speech" || e.error === "aborted") && isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { /* ignore */ }
          }
        }, 300);
        return;
      }

      isListeningRef.current = false;
      setIsListening(false);
      setLiveTranscript("");
      transcriptRef.current = "";
      recognitionRef.current = null;

      if (e.error === "not-allowed") {
        toast({ title: "Permissão do microfone negada", description: "Ative nas configurações do navegador.", variant: "destructive" });
      }
    };

    recognition.onend = () => {
      console.log("[STT] onend | isListening:", isListeningRef.current);

      // Em mobile, finaliza a captura sem tentar restart automático
      if (isMobile) {
        const finalText = transcriptRef.current.trim();
        isListeningRef.current = false;
        setIsListening(false);
        setLiveTranscript("");
        transcriptRef.current = "";
        recognitionRef.current = null;

        if (finalText) sendMessage(finalText);
        return;
      }

      if (isListeningRef.current && recognitionRef.current) {
        setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch {
              isListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      console.log("[STT] Recognition started successfully");
    } catch (err) {
      console.error("[STT] Start error:", err);
      isListeningRef.current = false;
      setIsListening(false);
      toast({ title: "Erro ao iniciar microfone", variant: "destructive" });
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      isListeningRef.current = false;
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
    stopSpeaking();

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // CRITICAL: On mobile, request mic permission SYNCHRONOUSLY within user gesture
    // then start recognition in the .then() callback to preserve gesture context
    if (isMobile && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          stream.getTracks().forEach(t => t.stop());
          console.log("[STT] Mobile: mic permission granted via getUserMedia");
          startRecognition();
        })
        .catch((err) => {
          console.error("[STT] getUserMedia denied:", err);
          toast({ title: "Permissão do microfone negada", description: "Ative nas configurações do navegador.", variant: "destructive" });
        });
    } else {
      startRecognition();
    }
  };

  const clearChat = async () => {
    if (!user || !conversationId) return;
    await supabase.from("chat_messages").delete().eq("conversation_id", conversationId);
    setMessages([]);
    setShowProgressCards(false);
    toast({ title: "Chat limpo com sucesso!" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };



  const assistantName = settings.assistantName || "Horus";
  const lastAiMessage = [...messages].reverse().find(m => m.role === "assistant");
  const lastAiText = lastAiMessage?.content
    ? lastAiMessage.content.replace(/[*#_`~\[\]()>]/g, "").slice(0, 220)
    : null;

  const statusLabel = isLoading ? "PROCESSANDO" : isListening ? "OUVINDO" : isSpeaking ? "FALANDO" : "PRONTO";

  const globeSize = typeof window !== "undefined"
    ? Math.min(360, Math.min(window.innerWidth * 0.68, window.innerHeight * 0.46))
    : 360;

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#020d14]">
        <HorusConstellation isThinking isSpeaking={false} size={300} />
        <p className="mt-6 text-[10px] font-mono tracking-[0.3em] text-cyan-400/50 uppercase">Inicializando sistema...</p>
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
        {/* Horizontal scan line animation */}
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg,transparent,rgba(0,200,255,0.07),transparent)" }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* ── Screen-corner HUD brackets ──────────────────────────────────── */}
      {(["tl","tr","bl","br"] as const).map(c => (
        <div key={c} className="absolute z-10 pointer-events-none" style={{
          width: 22, height: 22,
          top:    c.startsWith("t") ? 14 : "auto", bottom: c.startsWith("b") ? 14 : "auto",
          left:   c.endsWith("l")   ? 14 : "auto", right:  c.endsWith("r")   ? 14 : "auto",
          borderTop:    c.startsWith("t") ? "1.5px solid rgba(0,200,255,0.40)" : "none",
          borderBottom: c.startsWith("b") ? "1.5px solid rgba(0,200,255,0.40)" : "none",
          borderLeft:   c.endsWith("l")   ? "1.5px solid rgba(0,200,255,0.40)" : "none",
          borderRight:  c.endsWith("r")   ? "1.5px solid rgba(0,200,255,0.40)" : "none",
        }} />
      ))}

      {/* ── Top HUD strip ───────────────────────────────────────────────── */}
      <div className="relative z-10 shrink-0 flex items-center justify-between px-8 pt-5 pb-1.5">
        {/* Left: name + status dot */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono tracking-[0.28em] uppercase" style={{ color: "rgba(0,200,255,0.75)" }}>
              {assistantName} · Interface Neural
            </span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300",
                isLoading || isSpeaking || isListening
                  ? "bg-cyan-400 shadow-[0_0_7px_2px_rgba(0,200,255,0.75)]"
                  : "bg-cyan-400/25"
              )} />
              <span className="text-[9px] font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(0,200,255,0.45)" }}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          {isSpeaking && (
            <button onClick={stopSpeaking}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-mono tracking-wider uppercase transition-all"
              style={{ borderColor: "rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.85)" }}>
              <VolumeX className="w-3 h-3" /> Parar
            </button>
          )}
          {!isSpeaking && lastAiText && settings.ttsEnabled && (
            <button onClick={() => {
                const a = new Audio();
                a.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
                a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
                pendingAudioRef.current = a;
                replayLastResponse();
              }}
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
          <HorusConstellation isThinking={isLoading} isSpeaking={isSpeaking} size={globeSize} />
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

        {/* ── Holographic Response / Transcript Panel ─────────────────── */}
        <div className="w-full max-w-lg mt-3 px-2">
          <AnimatePresence mode="wait">

            {/* LISTENING — user voice input */}
            {isListening && (
              <motion.div
                key="listening-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(0,200,255,0.22)", background: "rgba(0,200,255,0.04)" }}
              >
                <HudBracket pos="tl" /><HudBracket pos="tr" /><HudBracket pos="bl" /><HudBracket pos="br" />
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "rgba(0,200,255,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <motion.span className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                      animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    <span className="text-[9px] font-mono tracking-[0.22em] uppercase" style={{ color: "rgba(0,200,255,0.7)" }}>
                      Entrada de voz
                    </span>
                  </div>
                  <AudioBars active color="rgba(0,200,255," />
                </div>
                {/* Transcript text */}
                <div className="px-4 py-3 min-h-[48px]">
                  {liveTranscript ? (
                    <p className="text-sm font-mono leading-relaxed" style={{ color: "rgba(180,235,255,0.85)" }}>
                      &ldquo;{liveTranscript}&rdquo;
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono italic" style={{ color: "rgba(0,200,255,0.3)" }}>
                      Aguardando fala...
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* LOADING — processing */}
            {isLoading && !isListening && (
              <motion.div
                key="loading-panel"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(0,170,255,0.18)", background: "rgba(0,100,200,0.04)" }}
              >
                <HudBracket pos="tl" /><HudBracket pos="tr" /><HudBracket pos="bl" /><HudBracket pos="br" />
                <div className="flex items-center gap-3 px-4 py-3">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: "rgba(0,200,255,0.6)" }} />
                  <span className="text-[11px] font-mono tracking-wider" style={{ color: "rgba(0,200,255,0.5)" }}>
                    Processando solicitação...
                  </span>
                  {/* Animated dots */}
                  <div className="flex gap-1 ml-auto">
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="w-1 h-1 rounded-full bg-cyan-400/50"
                        animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESPONSE — AI last answer */}
            {!isListening && !isLoading && lastAiText && (
              <motion.div
                key={lastAiText.slice(0, 28)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35 }}
                className="relative rounded-xl overflow-hidden"
                style={{ border: `1px solid rgba(0,200,255,${isSpeaking ? 0.35 : 0.18})`, background: `rgba(0,200,255,${isSpeaking ? 0.06 : 0.03})`, boxShadow: isSpeaking ? "0 0 28px rgba(0,200,255,0.08)" : "none", transition: "all 0.4s ease" }}
              >
                <HudBracket pos="tl" /><HudBracket pos="tr" /><HudBracket pos="bl" /><HudBracket pos="br" />

                {/* Scan line overlay when speaking */}
                {isSpeaking && (
                  <motion.div className="absolute left-0 right-0 h-6 pointer-events-none z-0"
                    style={{ background: "linear-gradient(0deg,transparent,rgba(0,200,255,0.05),transparent)" }}
                    animate={{ top: ["-10%", "110%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
                )}

                {/* Panel header */}
                <div className="relative z-10 flex items-center justify-between px-4 py-2 border-b"
                  style={{ borderColor: "rgba(0,200,255,0.12)" }}>
                  <div className="flex items-center gap-2">
                    {/* Hexagonal "AI" icon */}
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-black"
                      style={{ background: "rgba(0,200,255,0.15)", color: "rgba(0,220,255,0.85)", border: "1px solid rgba(0,200,255,0.3)" }}>
                      ◈
                    </span>
                    <span className="text-[9px] font-mono tracking-[0.22em] uppercase" style={{ color: "rgba(0,200,255,0.7)" }}>
                      {assistantName}
                    </span>
                    {isSpeaking && (
                      <motion.span className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ background: "rgba(0,200,255,0.12)", color: "rgba(0,220,255,0.8)", border: "1px solid rgba(0,200,255,0.2)" }}>
                        TRANSMITINDO
                      </motion.span>
                    )}
                  </div>
                  {/* Character count */}
                  <span className="text-[8px] font-mono" style={{ color: "rgba(0,200,255,0.28)" }}>
                    {lastAiMessage!.content.length} CHARS
                  </span>
                </div>

                {/* Separator with animated dot */}
                <div className="relative flex items-center px-4" style={{ height: 1 }}>
                  <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,200,255,0.25), transparent)" }} />
                  {isSpeaking && (
                    <motion.div className="absolute left-4 w-1.5 h-1.5 rounded-full bg-cyan-400"
                      animate={{ left: ["1rem", "calc(100% - 1.5rem)"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                  )}
                </div>

                {/* Response text with typewriter */}
                <div className="relative z-10 px-4 pt-3 pb-4">
                  <p className="text-[13px] font-mono leading-relaxed" style={{ color: "rgba(185,235,255,0.80)" }}>
                    <TypewriterText
                      key={lastAiText.slice(0, 28)}
                      text={lastAiText + (lastAiMessage!.content.length > 220 ? "…" : "")}
                      speed={16}
                    />
                  </p>
                </div>
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
            disabled={isLoading}
            className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none",
              isListening
                ? "border-2 border-cyan-400/90 text-cyan-300"
                : isLoading
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
              : isLoading ? <Loader2 className="w-5 h-5 animate-spin" />
              : <Mic className="w-5 h-5" />}
          </button>
        </div>

        <span className="text-[9px] font-mono tracking-[0.3em] uppercase select-none"
          style={{ color: "rgba(0,200,255,0.30)" }}>
          {isListening ? "Clique para enviar" : isLoading ? "Aguarde..." : "Clique para falar"}
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
