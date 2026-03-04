import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, MessageSquare, CheckSquare, FolderKanban,
  Bell, Flame, DollarSign, StickyNote, Brain, CalendarDays,
  Mail, MessageCircle, Bot, Settings, User, Palette, BellRing,
  Cpu, Plug, TrendingUp, CheckCheck, AlertTriangle,
  Clock, BarChart3,
} from "lucide-react";
import type { AppView } from "@/pages/AppDashboard";

interface CommandPaletteProps {
  onNavigate: (view: AppView) => void;
}

const commands: { group: string; items: { id: AppView; label: string; icon: React.ElementType; keywords?: string }[] }[] = [
  {
    group: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: "inicio home painel" },
      { id: "chat", label: "Horus IA", icon: MessageSquare, keywords: "chat ia assistente inteligencia artificial" },
    ],
  },
  {
    group: "Tarefas",
    items: [
      { id: "tasks", label: "Todas as Tarefas", icon: CheckSquare, keywords: "tarefa task lista" },
      { id: "tasks-today", label: "Tarefas de Hoje", icon: Clock, keywords: "hoje today tarefa" },
      { id: "tasks-overdue", label: "Tarefas Atrasadas", icon: AlertTriangle, keywords: "atrasada overdue vencida" },
      { id: "tasks-completed", label: "Tarefas Concluídas", icon: CheckCheck, keywords: "concluida done finalizada" },
    ],
  },
  {
    group: "Módulos",
    items: [
      { id: "projects", label: "Projetos", icon: FolderKanban, keywords: "projeto kanban" },
      { id: "reminders", label: "Lembretes", icon: Bell, keywords: "lembrete reminder notificacao" },
      { id: "habits", label: "Hábitos", icon: Flame, keywords: "habito habitos rotina" },
      { id: "finances", label: "Finanças", icon: DollarSign, keywords: "financas dinheiro receita despesa" },
      { id: "finances-income", label: "Receitas", icon: TrendingUp, keywords: "receita entrada dinheiro" },
      { id: "finances-expenses", label: "Despesas", icon: BarChart3, keywords: "despesa saida gasto" },
      { id: "notes", label: "Notas", icon: StickyNote, keywords: "nota anotacao texto" },
      { id: "analysis", label: "Análise Horus", icon: Brain, keywords: "analise relatorio inteligencia" },
    ],
  },
  {
    group: "Apps & Comunicação",
    items: [
      { id: "agenda", label: "Google Calendar", icon: CalendarDays, keywords: "agenda calendario google" },
      { id: "gmail", label: "Gmail", icon: Mail, keywords: "email gmail correio" },
      { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, keywords: "whatsapp mensagem chat" },
      { id: "telegram", label: "Telegram", icon: Bot, keywords: "telegram bot mensagem" },
    ],
  },
  {
    group: "Configurações",
    items: [
      { id: "settings-profile", label: "Perfil", icon: User, keywords: "perfil usuario conta" },
      { id: "settings-appearance", label: "Aparência", icon: Palette, keywords: "tema cor aparencia dark light" },
      { id: "settings-notifications", label: "Notificações", icon: BellRing, keywords: "notificacao alerta" },
      { id: "settings-ai", label: "Configurar IA", icon: Cpu, keywords: "ia ai openai chave api" },
      { id: "settings-integrations", label: "Integrações", icon: Plug, keywords: "google calendar gmail whatsapp integracao" },
      { id: "settings", label: "Configurações", icon: Settings, keywords: "config settings opcoes" },
    ],
  },
];

export const CommandPalette = ({ onNavigate }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Navegar para... (ex: tarefas, finanças, IA)" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {commands.map((group, i) => (
          <div key={group.group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.keywords ?? ""}`}
                  onSelect={() => handleSelect(item.id)}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
