import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const transactions = [
  { id: 1, title: "Salário mensal", category: "trabalho", date: "17/02", amount: 4500, type: "income" },
  { id: 2, title: "Freelance design gráfico", category: "trabalho", date: "17/02", amount: 800, type: "income" },
  { id: 3, title: "Supermercado", category: "alimentação", date: "16/02", amount: -180, type: "expense" },
  { id: 4, title: "Conta de luz", category: "casa", date: "14/02", amount: -250, type: "expense" },
  { id: 5, title: "Gasolina", category: "transporte", date: "13/02", amount: -120, type: "expense" },
  { id: 6, title: "Plano de saúde", category: "saúde", date: "12/02", amount: -380, type: "expense" },
];

const totalIncome = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
const totalExpense = transactions.filter(t => t.type === "expense").reduce((a, t) => a + Math.abs(t.amount), 0);

export const FinancesView = ({ subView }: { subView?: string }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--nectar-green))]/20 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Finanças</h2>
          <p className="text-xs text-muted-foreground">Controle financeiro</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pt-4 grid grid-cols-3 gap-3">
        <Card className="bg-[hsl(var(--nectar-green))]/10 border-[hsl(var(--nectar-green))]/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))] mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-[hsl(var(--nectar-green))]">R$ {totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-4 h-4 text-destructive mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-lg font-bold text-destructive">R$ {totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className="text-lg font-bold text-primary">R$ {(totalIncome - totalExpense).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {transactions.map((t) => (
            <Card key={t.id} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === "income" ? "bg-[hsl(var(--nectar-green))]/20" : "bg-destructive/20")}>
                    {t.type === "income" ? <TrendingUp className="w-4 h-4 text-[hsl(var(--nectar-green))]" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.category} • {t.date}</p>
                  </div>
                </div>
                <span className={cn("text-sm font-semibold", t.type === "income" ? "text-[hsl(var(--nectar-green))]" : "text-destructive")}>
                  {t.type === "income" ? "+" : "-"}R$ {Math.abs(t.amount).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
