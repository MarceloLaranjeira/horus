import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFinances } from "@/hooks/useFinances";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const FinancesView = ({ subView }: { subView?: string }) => {
  const { transactions, categories, isLoading, addTransaction, addCategory, deleteTransaction } = useFinances();
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newCatName, setNewCatName] = useState("");

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
  };

  const handleAdd = () => {
    if (!newDesc.trim() || !newAmount) return;
    addTransaction.mutate(
      { type: newType, amount: parseFloat(newAmount), description: newDesc },
      {
        onSuccess: () => { setNewDesc(""); setNewAmount(""); toast.success("Transação adicionada!"); },
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
        </div>
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"><Wallet className="w-8 h-8 mb-2 opacity-50" /><p>Nenhuma categoria criada</p></div>
            ) : categories.map(c => (
              <Card key={c.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium flex-1">{c.name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/20 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">{subLabels[subView || "finances"]}</h2>
          <p className="text-xs text-muted-foreground">Controle financeiro</p>
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
      <div className="px-6 py-3 border-b border-border flex gap-2">
        <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descrição..." className="flex-1 bg-secondary" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Valor" className="w-28 bg-secondary" />
        <Select value={newType} onValueChange={(v) => setNewType(v as any)}>
          <SelectTrigger className="w-28 bg-secondary"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Button size="icon" onClick={handleAdd} disabled={addTransaction.isPending}><Plus className="w-4 h-4" /></Button>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm"><DollarSign className="w-8 h-8 mb-2 opacity-50" /><p>Nenhuma transação</p></div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {filtered.map(t => (
              <Card key={t.id} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === "income" ? "bg-[hsl(var(--nectar-green))]/20" : "bg-destructive/20")}>
                      {t.type === "income" ? <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.budget_categories?.name && `${t.budget_categories.name} • `}
                        {format(parseISO(t.transaction_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", t.type === "income" ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                      {t.type === "income" ? "+" : "-"}R$ {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTransaction.mutate(t.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
