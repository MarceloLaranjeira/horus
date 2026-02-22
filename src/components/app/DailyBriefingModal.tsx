import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Sun, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BriefingData {
  tasks: { title: string; priority: string; due_date: string | null; status: string }[];
  habits: { name: string; completedToday: boolean }[];
  reminders: { title: string; due_date: string }[];
  calendarEvents: { summary: string; start: string }[];
  finances: { balance: number; income: number; expenses: number };
}

interface DailyBriefingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BriefingData;
}

const BRIEFING_KEY = "auratask_last_briefing_date";

export function useDailyBriefing() {
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const last = localStorage.getItem(BRIEFING_KEY);
    if (last !== today) {
      // Small delay so dashboard data loads first
      const timer = setTimeout(() => setShowBriefing(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(BRIEFING_KEY, format(new Date(), "yyyy-MM-dd"));
    setShowBriefing(false);
  }, []);

  return { showBriefing, setShowBriefing, dismiss };
}

export function DailyBriefingModal({ open, onOpenChange, data }: DailyBriefingModalProps) {
  const [briefingText, setBriefingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generateBriefing = useCallback(async () => {
    setLoading(true);
    setBriefingText("");
    setGenerated(false);

    const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

    const summaryPrompt = `Hoje é ${today}. Gere um briefing diário conciso e motivacional para o usuário com base nos seguintes dados:

**Tarefas pendentes (${data.tasks.length}):**
${data.tasks.slice(0, 10).map(t => `- ${t.title} (prioridade: ${t.priority}${t.due_date ? `, vence: ${t.due_date}` : ""})`).join("\n") || "Nenhuma tarefa pendente."}

**Hábitos do dia (${data.habits.length}):**
${data.habits.map(h => `- ${h.name}: ${h.completedToday ? "✅ feito" : "⬜ pendente"}`).join("\n") || "Nenhum hábito ativo."}

**Lembretes próximos (${data.reminders.length}):**
${data.reminders.slice(0, 5).map(r => `- ${r.title} às ${format(new Date(r.due_date), "HH:mm 'de' dd/MM", { locale: ptBR })}`).join("\n") || "Sem lembretes."}

**Compromissos do dia:**
${data.calendarEvents.slice(0, 5).map(e => `- ${e.summary} às ${e.start}`).join("\n") || "Sem compromissos no calendário."}

**Finanças do mês:**
Receitas: R$ ${data.finances.income.toFixed(2)} | Despesas: R$ ${data.finances.expenses.toFixed(2)} | Saldo: R$ ${data.finances.balance.toFixed(2)}

INSTRUÇÕES:
- Seja breve (máximo 200 palavras)
- Use emojis com moderação
- Comece com uma saudação baseada no horário (bom dia/boa tarde/boa noite)
- Destaque as prioridades mais urgentes
- Termine com uma frase motivacional curta
- Formate em markdown com seções claras
- Responda em português brasileiro`;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: summaryPrompt }],
            mode: "chat",
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to generate briefing");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setBriefingText(fullText);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      setGenerated(true);
    } catch (err) {
      console.error("Briefing error:", err);
      setBriefingText("Não foi possível gerar o briefing. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (open && !generated && !loading) {
      generateBriefing();
    }
  }, [open, generated, loading, generateBriefing]);

  const handleClose = () => {
    localStorage.setItem(BRIEFING_KEY, format(new Date(), "yyyy-MM-dd"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-[hsl(var(--nectar-orange))]" />
            <span className="text-gradient-cyan">Briefing do Dia</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-auto pr-1">
          {loading && !briefingText ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparando seu briefing...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="prose prose-sm dark:prose-invert max-w-none text-sm"
            >
              <ReactMarkdown>{briefingText}</ReactMarkdown>
            </motion.div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGenerated(false);
              setBriefingText("");
              generateBriefing();
            }}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar
          </Button>
          <Button size="sm" onClick={handleClose} className="flex-1">
            Começar o dia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
