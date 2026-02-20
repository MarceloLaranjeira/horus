import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet, Edit2, X, Check, BarChart3, PieChart, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFinances } from "@/hooks/useFinances";
import { toast } from "sonner";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

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

export const FinancesView = ({ subView }: { subView?: string }) => {
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
      {
        type: newType,
        amount: parseFloat(newAmount),
        description: newDesc,
        category_id: newCategoryId !== "none" ? newCategoryId : undefined,
        transaction_date: newDate,
      },
      {
        onSuccess: () => { setNewDesc(""); setNewAmount(""); setNewCategoryId("none"); toast.success("Transação adicionada!"); },
        onError: () => toast.error("Erro ao adicionar"),
      }
    );
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory.mutate({ name: newCatName }, {
      onSuccess: () => { setNewCatName(""); toast.success("Categoria criada!"); },
    });
  };

  const handleAddDefaultCategories = () => {
    const existingNames = categories.map(c => c.name.toLowerCase());
    const toAdd = DEFAULT_CATEGORIES.filter(n => !existingNames.includes(n.toLowerCase()));
    if (toAdd.length === 0) { toast.info("Todas as categorias já existem"); return; }
    toAdd.forEach((name, i) => {
      addCategory.mutate({ name, color: PIE_COLORS[i % PIE_COLORS.length] });
    });
    toast.success(`${toAdd.length} categorias adicionadas!`);
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditDesc(t.description);
    setEditAmount(String(t.amount));
    setEditType(t.type);
  };

  const saveEdit = () => {
    if (!editingId || !editDesc.trim() || !editAmount) return;
    updateTransaction.mutate(
      { id: editingId, type: editType, amount: parseFloat(editAmount), description: editDesc },
      {
        onSuccess: () => { setEditingId(null); toast.success("Atualizado!"); },
        onError: () => toast.error("Erro ao atualizar"),
      }
    );
  };

  // PIE CHART DATA - group expenses by category
  const pieData = useMemo(() => {
    const expensesByCategory: Record<string, { name: string; value: number }> = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const catName = t.budget_categories?.name || "Sem Categoria";
        if (!expensesByCategory[catName]) expensesByCategory[catName] = { name: catName, value: 0 };
        expensesByCategory[catName].value += Number(t.amount);
      });
    return Object.values(expensesByCategory).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    transactions
      .filter(t => t.type === "income")
      .forEach(t => {
        const catName = t.budget_categories?.name || "Sem Categoria";
        if (!map[catName]) map[catName] = { name: catName, value: 0 };
        map[catName].value += Number(t.amount);
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // CASH FLOW DATA - last 6 months
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const monthIncome = transactions
        .filter(t => t.type === "income" && parseISO(t.transaction_date) >= start && parseISO(t.transaction_date) <= end)
        .reduce((a, t) => a + Number(t.amount), 0);
      const monthExpense = transactions
        .filter(t => t.type === "expense" && parseISO(t.transaction_date) >= start && parseISO(t.transaction_date) <= end)
        .reduce((a, t) => a + Number(t.amount), 0);
      return {
        month: format(month, "MMM/yy", { locale: ptBR }),
        receitas: monthIncome,
        despesas: monthExpense,
        saldo: monthIncome - monthExpense,
      };
    });
  }, [transactions]);

  // ===== ANALYSIS VIEW =====
  if (subView === "finances-analysis") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><PieChart className="w-4 h-4 text-primary" /></div>
          <div><h2 className="font-semibold text-sm">Análise Financeira</h2><p className="text-xs text-muted-foreground">Distribuição de gastos e receitas</p></div>
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Expense Pie Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="w-4 h-4 text-destructive" />Despesas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma despesa registrada</p>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium text-destructive">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                        <span>Total</span>
                        <span className="text-destructive">R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Income Pie Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" />Receitas por Categoria</CardTitle></CardHeader>
              <CardContent>
                {incomeByCategory.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">Nenhuma receita registrada</p>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-64 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                            {incomeByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {incomeByCategory.map((item, i) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium text-[hsl(var(--nectar-green))]">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                        <span>Total</span>
                        <span className="text-[hsl(var(--nectar-green))]">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}
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
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      <Legend />
                      <Bar dataKey="receitas" name="Receitas" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Summary Table */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader><CardTitle className="text-sm">Resumo Mensal</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {cashFlowData.map(m => (
                    <div key={m.month} className="flex items-center justify-between text-sm py-2 border-b border-border/30 last:border-0">
                      <span className="font-medium capitalize">{m.month}</span>
                      <div className="flex gap-6">
                        <span className="text-[hsl(var(--nectar-green))]">+R$ {m.receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <span className="text-destructive">-R$ {m.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        <span className={cn("font-semibold", m.saldo >= 0 ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                          {m.saldo >= 0 ? "+" : ""}R$ {m.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
        <div className="px-6 py-3 border-b border-border flex gap-2">
          <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nova categoria..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAddCategory()} />
          <Button size="icon" onClick={handleAddCategory}><Plus className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleAddDefaultCategories} className="text-xs whitespace-nowrap">
            Adicionar Padrões
          </Button>
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
                      {earned > 0 && <span className="text-[hsl(var(--nectar-green))]">Receitas: R$ {earned.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
                      {spent > 0 && <span className="text-destructive">Despesas: R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}
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

      {/* Summary */}
      {(subView === "finances" || !subView) && (
        <div className="px-6 pt-4 grid grid-cols-3 gap-3">
          <Card className="bg-[hsl(var(--nectar-green))]/10 border-[hsl(var(--nectar-green))]/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))] mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Receitas</p>
              <p className="text-lg font-bold text-[hsl(var(--nectar-green))]">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 text-center">
              <TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-destructive">R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="text-lg font-bold text-primary">R$ {(totalIncome - totalExpense).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
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
                    {/* Icon */}
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      t.type === "income" ? "bg-[hsl(var(--nectar-green))]/15" : "bg-destructive/15"
                    )}>
                      {t.type === "income"
                        ? <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                        : <TrendingDown className="w-4 h-4 text-destructive" />
                      }
                    </div>

                    {/* Content */}
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

                    {/* Amount + Type */}
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-bold", t.type === "income" ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                        {t.type === "income" ? "+" : "-"}R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className={cn("text-[10px]", t.type === "income" ? "text-[hsl(var(--nectar-green))]/70" : "text-destructive/70")}>
                        {t.type === "income" ? "Receita" : "Despesa"}
                      </p>
                    </div>

                    {/* Actions */}
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
