import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, Edit2, X, Check, BarChart3, PieChart, Calendar, ArrowUpRight, ArrowDownRight, Percent, Target, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFinances } from "@/hooks/useFinances";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart, ComposedChart,
} from "recharts";

const DEFAULT_CATEGORIES = [
  "Salário", "Alimentação", "Vestuário", "Casa", "Carro", "Aluguel",
  "Transporte", "Saúde", "Educação", "Lazer", "Investimentos",
  "Freelance", "Outros Recebimentos", "Contas", "Internet", "Telefone",
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(346, 77%, 50%)",
  "hsl(24, 94%, 50%)",
  "hsl(173, 80%, 40%)",
  "hsl(291, 64%, 42%)",
  "hsl(47, 96%, 53%)",
  "hsl(215, 76%, 56%)",
  "hsl(0, 72%, 51%)",
  "hsl(160, 60%, 45%)",
  "hsl(330, 81%, 60%)",
  "hsl(200, 50%, 50%)",
];

const fmtBRL = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtBRLShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
};

const FINANCE_TABS = [
  { id: "finances", label: "Visão Geral", icon: DollarSign },
  { id: "finances-income", label: "Receitas", icon: TrendingUp },
  { id: "finances-expenses", label: "Despesas", icon: TrendingDown },
  { id: "finances-budget", label: "Orçamento", icon: Wallet },
  { id: "finances-cashflow", label: "Fluxo de Caixa", icon: BarChart3 },
  { id: "finances-analysis", label: "Análise", icon: PieChart },
] as const;

export const FinancesView = ({ subView, onNavigate }: { subView?: string; onNavigate?: (view: any) => void }) => {
  const TabBar = () => (
    <div className="px-4 py-2 border-b border-border/50 flex gap-1 overflow-x-auto scrollbar-hide">
      {FINANCE_TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = (subView || "finances") === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate?.(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
  const { transactions, categories, isLoading, addTransaction, addCategory, deleteTransaction, updateTransaction } = useFinances();

  // Form state
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newCategoryId, setNewCategoryId] = useState<string>("none");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newCatName, setNewCatName] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");

  const filtered = transactions.filter(t => {
    if (subView === "finances-income") return t.type === "income";
    if (subView === "finances-expenses") return t.type === "expense";
    return true;
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const subLabels: Record<string, string> = {
    finances: "Visão Geral",
    "finances-income": "Receitas",
    "finances-expenses": "Despesas",
    "finances-budget": "Orçamento",
    "finances-cashflow": "Fluxo de Caixa",
    "finances-analysis": "Análise Financeira",
  };

  const handleAdd = () => {
    if (!newDesc.trim() || !newAmount) return;
    addTransaction.mutate(
      { type: newType, amount: parseFloat(newAmount), description: newDesc, category_id: newCategoryId !== "none" ? newCategoryId : undefined, transaction_date: newDate },
      { onSuccess: () => { setNewDesc(""); setNewAmount(""); setNewCategoryId("none"); toast.success("Transação adicionada!"); }, onError: () => toast.error("Erro ao adicionar") }
    );
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory.mutate({ name: newCatName }, { onSuccess: () => { setNewCatName(""); toast.success("Categoria criada!"); } });
  };

  const handleAddDefaultCategories = () => {
    const existingNames = categories.map(c => c.name.toLowerCase());
    const toAdd = DEFAULT_CATEGORIES.filter(n => !existingNames.includes(n.toLowerCase()));
    if (toAdd.length === 0) { toast.info("Todas as categorias já existem"); return; }
    toAdd.forEach((name, i) => { addCategory.mutate({ name, color: PIE_COLORS[i % PIE_COLORS.length] }); });
    toast.success(`${toAdd.length} categorias adicionadas!`);
  };

  const startEdit = (t: any) => { setEditingId(t.id); setEditDesc(t.description); setEditAmount(String(t.amount)); setEditType(t.type); };

  const saveEdit = () => {
    if (!editingId || !editDesc.trim() || !editAmount) return;
    updateTransaction.mutate(
      { id: editingId, type: editType, amount: parseFloat(editAmount), description: editDesc },
      { onSuccess: () => { setEditingId(null); toast.success("Atualizado!"); }, onError: () => toast.error("Erro ao atualizar") }
    );
  };

  // PIE DATA
  const pieData = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      const catName = t.budget_categories?.name || "Sem Categoria";
      if (!map[catName]) map[catName] = { name: catName, value: 0 };
      map[catName].value += Number(t.amount);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    transactions.filter(t => t.type === "income").forEach(t => {
      const catName = t.budget_categories?.name || "Sem Categoria";
      if (!map[catName]) map[catName] = { name: catName, value: 0 };
      map[catName].value += Number(t.amount);
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // CASH FLOW DATA - last 6 months + 3 month projection
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    const historical = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthIncome = transactions.filter(t => t.type === "income" && parseISO(t.transaction_date) >= start && parseISO(t.transaction_date) <= end).reduce((a, t) => a + Number(t.amount), 0);
      const monthExpense = transactions.filter(t => t.type === "expense" && parseISO(t.transaction_date) >= start && parseISO(t.transaction_date) <= end).reduce((a, t) => a + Number(t.amount), 0);
      return { month: format(month, "MMM/yy", { locale: ptBR }), receitas: monthIncome, despesas: monthExpense, saldo: monthIncome - monthExpense, projected: false };
    });
    return historical;
  }, [transactions]);

  // Projection data (next 3 months based on averages)
  const projectionData = useMemo(() => {
    const now = new Date();
    const monthsWithData = cashFlowData.filter(m => m.receitas > 0 || m.despesas > 0);
    if (monthsWithData.length === 0) return [];
    const avgIncome = monthsWithData.reduce((a, m) => a + m.receitas, 0) / monthsWithData.length;
    const avgExpense = monthsWithData.reduce((a, m) => a + m.despesas, 0) / monthsWithData.length;
    return [1, 2, 3].map(i => {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        month: format(futureDate, "MMM/yy", { locale: ptBR }),
        receitasProj: Math.round(avgIncome),
        despesasProj: Math.round(avgExpense),
        saldoProj: Math.round(avgIncome - avgExpense),
        projected: true,
      };
    });
  }, [cashFlowData]);

  // KPI calculations
  const kpiData = useMemo(() => {
    const monthsWithData = cashFlowData.filter(m => m.receitas > 0 || m.despesas > 0);
    const numMonths = Math.max(monthsWithData.length, 1);
    const avgMonthlyIncome = totalIncome / numMonths;
    const avgMonthlyExpense = totalExpense / numMonths;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // Current month
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const currentMonthIncome = transactions.filter(t => t.type === "income" && parseISO(t.transaction_date) >= currentMonthStart && parseISO(t.transaction_date) <= currentMonthEnd).reduce((a, t) => a + Number(t.amount), 0);
    const currentMonthExpense = transactions.filter(t => t.type === "expense" && parseISO(t.transaction_date) >= currentMonthStart && parseISO(t.transaction_date) <= currentMonthEnd).reduce((a, t) => a + Number(t.amount), 0);

    // Previous month comparison
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const prevMonthExpense = transactions.filter(t => t.type === "expense" && parseISO(t.transaction_date) >= prevMonthStart && parseISO(t.transaction_date) <= prevMonthEnd).reduce((a, t) => a + Number(t.amount), 0);
    const expenseChange = prevMonthExpense > 0 ? ((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0;

    // Top expense category
    const topExpenseCategory = pieData.length > 0 ? pieData[0] : null;
    const topExpensePct = totalExpense > 0 && topExpenseCategory ? (topExpenseCategory.value / totalExpense) * 100 : 0;

    return { avgMonthlyIncome, avgMonthlyExpense, savingsRate, currentMonthIncome, currentMonthExpense, expenseChange, topExpenseCategory, topExpensePct, numMonths };
  }, [transactions, cashFlowData, totalIncome, totalExpense, pieData]);

  // Combined chart data for projections
  const combinedChartData = useMemo(() => {
    const hist = cashFlowData.map(m => ({ ...m, receitasProj: undefined as number | undefined, despesasProj: undefined as number | undefined }));
    const proj = projectionData.map(m => ({ ...m, receitas: undefined as number | undefined, despesas: undefined as number | undefined, saldo: undefined as number | undefined }));
    return [...hist, ...proj];
  }, [cashFlowData, projectionData]);

  // ===== ANALYSIS VIEW =====
  if (subView === "finances-analysis") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><PieChart className="w-4 h-4 text-primary" /></div>
          <div><h2 className="font-semibold text-sm">Análise Financeira</h2><p className="text-xs text-muted-foreground">KPIs, relatórios e projeções</p></div>
        </div>
        <TabBar />
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/15 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Receita Mensal Média</span>
                  </div>
                  <p className="text-xl font-bold text-[hsl(var(--nectar-green))]">{fmtBRL(kpiData.avgMonthlyIncome)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Baseado em {kpiData.numMonths} meses</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Gasto Mensal Médio</span>
                  </div>
                  <p className="text-xl font-bold text-destructive">{fmtBRL(kpiData.avgMonthlyExpense)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {kpiData.expenseChange !== 0 && (
                      <>
                        {kpiData.expenseChange > 0 ? <ArrowUpRight className="w-3 h-3 text-destructive" /> : <ArrowDownRight className="w-3 h-3 text-[hsl(var(--nectar-green))]" />}
                        <span className={cn("text-[10px] font-medium", kpiData.expenseChange > 0 ? "text-destructive" : "text-[hsl(var(--nectar-green))]")}>
                          {Math.abs(kpiData.expenseChange).toFixed(1)}% vs mês anterior
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Percent className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Taxa de Poupança</span>
                  </div>
                  <p className={cn("text-xl font-bold", kpiData.savingsRate >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                    {kpiData.savingsRate.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {kpiData.savingsRate >= 20 ? "Excelente!" : kpiData.savingsRate >= 10 ? "Bom" : kpiData.savingsRate >= 0 ? "Pode melhorar" : "Atenção!"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-gold))]/15 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[hsl(var(--nectar-gold))]" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">Maior Gasto</span>
                  </div>
                  <p className="text-sm font-bold text-[hsl(var(--nectar-gold))] truncate">
                    {kpiData.topExpenseCategory?.name || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {kpiData.topExpensePct > 0 ? `${kpiData.topExpensePct.toFixed(0)}% do total de despesas` : "Sem dados"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Current Month KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-[hsl(var(--nectar-green))]/5 border-[hsl(var(--nectar-green))]/15">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Receita este Mês</p>
                  <p className="text-lg font-bold text-[hsl(var(--nectar-green))]">{fmtBRL(kpiData.currentMonthIncome)}</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/15">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Despesas este Mês</p>
                  <p className="text-lg font-bold text-destructive">{fmtBRL(kpiData.currentMonthExpense)}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/15">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] text-muted-foreground mb-1">Saldo Geral</p>
                  <p className={cn("text-lg font-bold", balance >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>{fmtBRL(balance)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Expense Pie Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" />Relatório de Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma despesa registrada</p>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => fmtBRL(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {pieData.map((item, i) => {
                        const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</span>
                                <span className="font-medium text-destructive">{fmtBRL(item.value)}</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                        <span>Total Despesas</span>
                        <span className="text-destructive">{fmtBRL(totalExpense)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Pie Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" />Relatório de Receitas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {incomeByCategory.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma receita registrada</p>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {incomeByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => fmtBRL(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      {incomeByCategory.map((item, i) => {
                        const pct = totalIncome > 0 ? (item.value / totalIncome) * 100 : 0;
                        return (
                          <div key={item.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</span>
                                <span className="font-medium text-[hsl(var(--nectar-green))]">{fmtBRL(item.value)}</span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                        <span>Total Receitas</span>
                        <span className="text-[hsl(var(--nectar-green))]">{fmtBRL(totalIncome)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cash Flow + Projections Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Fluxo de Caixa e Projeções
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Últimos 6 meses + projeção de 3 meses (linhas tracejadas)</p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={combinedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={fmtBRLShort} />
                      <Tooltip formatter={(value: number) => fmtBRL(value)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      {/* Historical bars */}
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                      {/* Projected lines */}
                      <Line dataKey="receitasProj" name="Receita Projetada" stroke="hsl(142, 76%, 36%)" strokeDasharray="6 3" strokeWidth={2} dot={{ r: 4 }} />
                      <Line dataKey="despesasProj" name="Despesa Projetada" stroke="hsl(var(--destructive))" strokeDasharray="6 3" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Projection Summary */}
            {projectionData.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-[hsl(var(--nectar-gold))]" />Projeções para os Próximos Meses</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projectionData.map(m => (
                      <div key={m.month} className="flex items-center justify-between text-sm py-3 border-b border-border/30 last:border-0">
                        <span className="font-medium capitalize text-muted-foreground">{m.month}</span>
                        <div className="flex gap-6 items-center">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Receita Prevista</p>
                            <span className="text-[hsl(var(--nectar-green))] font-medium">{fmtBRL(m.receitasProj)}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Despesa Prevista</p>
                            <span className="text-destructive font-medium">{fmtBRL(m.despesasProj)}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Saldo Previsto</p>
                            <span className={cn("font-semibold", m.saldoProj >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                              {m.saldoProj >= 0 ? "+" : ""}{fmtBRL(m.saldoProj)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Summary Table */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm">Resumo Mensal Retroativo</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cashFlowData.map(m => (
                    <div key={m.month} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                      <span className="font-medium capitalize">{m.month}</span>
                      <div className="flex gap-6">
                        <span className="text-[hsl(var(--nectar-green))]">+{fmtBRL(m.receitas)}</span>
                        <span className="text-destructive">-{fmtBRL(m.despesas)}</span>
                        <span className={cn("font-semibold", m.saldo >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                          {m.saldo >= 0 ? "+" : ""}{fmtBRL(m.saldo)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </ScrollArea>
      </div>
    );
  }

  // ===== CASH FLOW VIEW =====
  if (subView === "finances-cashflow") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-primary" /></div>
          <div><h2 className="font-semibold text-sm">Fluxo de Caixa</h2><p className="text-xs text-muted-foreground">Últimos 6 meses</p></div>
        </div>
        <TabBar />
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={fmtBRLShort} />
                      <Tooltip formatter={(value: number) => fmtBRL(value)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm">Resumo Mensal</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cashFlowData.map(m => (
                    <div key={m.month} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                      <span className="font-medium capitalize">{m.month}</span>
                      <div className="flex gap-6">
                        <span className="text-[hsl(var(--nectar-green))]">+{fmtBRL(m.receitas)}</span>
                        <span className="text-destructive">-{fmtBRL(m.despesas)}</span>
                        <span className={cn("font-semibold", m.saldo >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                          {m.saldo >= 0 ? "+" : ""}{fmtBRL(m.saldo)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ===== BUDGET VIEW =====
  if (subView === "finances-budget") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><Wallet className="w-4 h-4 text-primary" /></div>
          <div><h2 className="font-semibold text-sm">Orçamento</h2><p className="text-xs text-muted-foreground">{categories.length} categorias</p></div>
        </div>
        <TabBar />
        <div className="px-6 py-3 border-b border-border flex gap-2">
          <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
          <Button size="icon" onClick={handleAddCategory}><Plus className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleAddDefaultCategories} className="text-xs whitespace-nowrap">Adicionar Padrões</Button>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                <Wallet className="w-8 h-8 mb-2 opacity-50" />
                <p>Nenhuma categoria criada</p>
                <Button variant="link" size="sm" onClick={handleAddDefaultCategories} className="mt-2">Criar categorias padrão</Button>
              </div>
            ) : categories.map(c => {
              const spent = transactions.filter(t => t.type === "expense" && t.category_id === c.id).reduce((a, t) => a + Number(t.amount), 0);
              const earned = transactions.filter(t => t.type === "income" && t.category_id === c.id).reduce((a, t) => a + Number(t.amount), 0);
              return (
                <Card key={c.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-sm font-medium flex-1">{c.name}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      {earned > 0 && <span className="text-[hsl(var(--nectar-green))]">Receitas: {fmtBRL(earned)}</span>}
                      {spent > 0 && <span className="text-destructive">Despesas: {fmtBRL(spent)}</span>}
                      {earned === 0 && spent === 0 && <span>Sem movimentações</span>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // ===== DEFAULT / INCOME / EXPENSES VIEW =====
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[hsl(var(--nectar-green))]/15 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold">{subLabels[subView || "finances"]}</h2>
          <p className="text-xs text-muted-foreground">Acompanhe receitas, despesas e investimentos</p>
        </div>
      </div>
      <TabBar />

      {/* Summary */}
      {(subView === "finances" || !subView) && (
        <div className="px-6 pt-4 grid grid-cols-3 gap-3">
          <Card className="bg-[hsl(var(--nectar-green))]/10 border-[hsl(var(--nectar-green))]/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))] mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold text-[hsl(var(--nectar-green))]">{fmtBRL(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 text-center">
              <TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-destructive">{fmtBRL(totalExpense)}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold text-primary">{fmtBRL(balance)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add form */}
      <div className="px-6 py-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Valor" className="w-28 bg-secondary" />
        </div>
        <div className="flex gap-2">
          <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
            <SelectTrigger className="w-28 bg-secondary"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Receita</SelectItem>
              <SelectItem value="expense">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newCategoryId} onValueChange={setNewCategoryId}>
            <SelectTrigger className="flex-1 bg-secondary"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem Categoria</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-36 bg-secondary" />
          <Button size="icon" onClick={handleAdd} disabled={addTransaction.isPending}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"><DollarSign className="w-8 h-8 mb-2 opacity-50" /><p>Nenhuma transação</p></div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 card-glow group">
                {editingId === t.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="flex-1 h-8 bg-secondary" />
                    <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-24 h-8 bg-secondary" />
                    <Select value={editType} onValueChange={(v) => setEditType(v as any)}>
                      <SelectTrigger className="w-24 h-8 bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[hsl(var(--nectar-green))]" onClick={saveEdit}><Check className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingId(null)}><X className="w-3.5 h-3.5" /></Button>
                  </div>
                ) : (
                  <>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", t.type === "income" ? "bg-[hsl(var(--nectar-green))]/15" : "bg-destructive/15")}>
                      {t.type === "income" ? <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {t.budget_categories?.name && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex items-center gap-1">
                            <DollarSign className="w-2.5 h-2.5" /> {t.budget_categories.name}
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {format(parseISO(t.transaction_date), "dd/MM")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold", t.type === "income" ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                        {t.type === "income" ? "+" : "-"}{fmtBRL(Number(t.amount))}
                      </p>
                      <p className={cn("text-[10px]", t.type === "income" ? "text-[hsl(var(--nectar-green))]/70" : "text-destructive/70")}>
                        {t.type === "income" ? "Receita" : "Despesa"}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEdit(t)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction.mutate(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
