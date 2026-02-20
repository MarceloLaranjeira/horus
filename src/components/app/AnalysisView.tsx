import { useState } from "react";
import { BarChart3, TrendingUp, DollarSign, Flame, CheckSquare, Brain, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useFinances } from "@/hooks/useFinances";
import { useProjects } from "@/hooks/useProjects";
import { useReminders } from "@/hooks/useReminders";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export const AnalysisView = () => {
  const { data: tasks = [] } = useTasks();
  const { habits, tracks } = useHabits();
  const { transactions } = useFinances();
  const { projects } = useProjects();
  const { reminders } = useReminders();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tasksDone = tasks.filter(t => t.status === "done").length;
  const tasksTotal = tasks.length;
  const taskCompletion = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const activeHabits = habits.filter(h => h.active).length;
  const completedTracks = tracks.filter(t => t.completed).length;

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const context = `
Dados do usuário para análise mensal:
- Tarefas: ${tasksTotal} criadas, ${tasksDone} concluídas (${taskCompletion}%)
- Tarefas por prioridade: urgente ${tasks.filter(t => t.priority === "urgent").length}, alta ${tasks.filter(t => t.priority === "high").length}, média ${tasks.filter(t => t.priority === "medium").length}, baixa ${tasks.filter(t => t.priority === "low").length}
- Projetos: ${projects.length} total, ${projects.filter(p => p.status === "done").length} concluídos, ${projects.filter(p => p.status === "in_progress").length} em andamento
- Hábitos: ${activeHabits} ativos, ${completedTracks} dias registrados no total
- Finanças: R$ ${totalIncome.toFixed(2)} receitas, R$ ${totalExpense.toFixed(2)} despesas, saldo R$ ${balance.toFixed(2)}
- Lembretes: ${reminders.length} total, ${reminders.filter(r => r.completed).length} concluídos
`;

      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `Você é o Maxx, um consultor pessoal de produtividade e finanças. Analise os dados do usuário e gere uma análise mensal completa com tom bem-humorado e insights acionáveis. Use markdown. Estruture assim:

## 📊 Resumo Executivo
(Parágrafo geral sobre o mês, com personalidade e humor sutil)

## 🚀 Produtividade
(Análise de tarefas, projetos e padrões. Mencione pontos fortes e fracos)

## 💰 Situação Financeira
(Análise de receitas, despesas e saldo. Dê insights práticos)

## 🔥 Hábitos & Rotina
(Análise dos hábitos, consistência e sugestões)

## 🎯 Potencial de Evolução
(Recomendações concretas para o próximo mês)`,
            },
            { role: "user", content: context },
          ],
        },
      });

      if (error) throw error;
      setAnalysis(data.content || data.message || "Análise não disponível.");
    } catch (err) {
      console.error(err);
      // Fallback: generate local analysis
      setAnalysis(generateLocalAnalysis());
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAnalysis = () => {
    return `## 📊 Resumo Executivo

Você tem **${tasksTotal} tarefas** criadas e concluiu **${tasksDone}** (${taskCompletion}%). ${taskCompletion > 60 ? "Boa taxa de conclusão!" : "Há espaço para melhorar a taxa de conclusão."}

${balance >= 0 ? "Financeiramente, você está no positivo" : "Atenção: suas despesas superam as receitas"} com saldo de **R$ ${balance.toFixed(2)}**.

## 🚀 Produtividade

- **${tasksDone}/${tasksTotal}** tarefas concluídas
- **${projects.filter(p => p.status === "in_progress").length}** projetos em andamento
- **${tasks.filter(t => t.priority === "high" || t.priority === "urgent").length}** tarefas de alta prioridade

${taskCompletion < 50 ? "Foque em concluir tarefas pendentes antes de criar novas." : "Continue mantendo esse ritmo de conclusão!"}

## 💰 Situação Financeira

- Receitas: **R$ ${totalIncome.toFixed(2)}**
- Despesas: **R$ ${totalExpense.toFixed(2)}**
- Saldo: **R$ ${balance.toFixed(2)}**
- Transações: **${transactions.length}** registradas

${totalExpense > totalIncome ? "⚠️ Despesas superam receitas. Revise seus gastos." : "✅ Saldo positivo. Continue controlando!"}

## 🔥 Hábitos & Rotina

- **${activeHabits}** hábitos ativos
- **${completedTracks}** dias registrados

${activeHabits === 0 ? "Comece criando ao menos 1 hábito diário!" : completedTracks > 20 ? "Excelente consistência nos hábitos!" : "Tente manter mais consistência nos seus hábitos."}

## 🎯 Potencial de Evolução

1. ${taskCompletion < 50 ? "Foque em completar tarefas existentes" : "Defina metas mais ambiciosas"}
2. ${balance < 0 ? "Reduza despesas não essenciais" : "Considere investir parte do saldo positivo"}
3. ${activeHabits < 3 ? "Adicione mais hábitos à sua rotina" : "Mantenha a consistência atual"}`;
  };

  const stats = [
    { icon: CheckSquare, label: "Tarefas", value: `${tasksDone}/${tasksTotal}`, sub: `${taskCompletion}%`, color: "nectar-blue" },
    { icon: DollarSign, label: "Saldo", value: `R$ ${balance.toFixed(0)}`, sub: balance >= 0 ? "Positivo" : "Negativo", color: balance >= 0 ? "nectar-green" : "destructive" },
    { icon: Flame, label: "Hábitos", value: `${activeHabits}`, sub: `${completedTracks} dias`, color: "nectar-orange" },
    { icon: TrendingUp, label: "Projetos", value: `${projects.length}`, sub: `${projects.filter(p => p.status === "done").length} concluídos`, color: "nectar-purple" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-purple))]/15 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[hsl(var(--nectar-purple))]" />
          </div>
          <div>
            <h2 className="font-semibold">Análise Maxx</h2>
            <p className="text-xs text-muted-foreground">Sua consultoria pessoal completa</p>
          </div>
        </div>
        <Button onClick={generateAnalysis} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          {loading ? "Analisando..." : analysis ? "Atualizar Análise" : "Gerar Análise"}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-border/50 card-glow text-center"
              >
                <div className={`w-8 h-8 mx-auto rounded-lg bg-[hsl(var(--${s.color}))]/15 flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 text-[hsl(var(--${s.color}))]`} />
                </div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Analysis Content */}
          {!analysis && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-xl bg-card border border-border/50 text-center"
            >
              <Brain className="w-12 h-12 mx-auto text-[hsl(var(--nectar-purple))] mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Maxx Análise</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Clique em "Gerar Análise" para que o Maxx analise seus dados e gere insights personalizados sobre produtividade, finanças e hábitos.
              </p>
            </motion.div>
          )}

          {loading && (
            <div className="p-12 rounded-xl bg-card border border-border/50 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-[hsl(var(--nectar-purple))] animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Maxx está analisando seus dados...</p>
            </div>
          )}

          {analysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-card border border-border/50 card-glow overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-border/50 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[hsl(var(--nectar-purple))]" />
                <span className="text-sm font-medium">Relatório Completo</span>
              </div>
              <div className="p-5 prose prose-sm dark:prose-invert max-w-none prose-headings:text-base prose-h2:mt-4 prose-h2:mb-2 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
