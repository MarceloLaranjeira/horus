import { FolderKanban, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const projects = [
  { id: 1, title: "Renovação do apartamento", progress: 37, status: "em andamento", steps: "2/3 etapas", deadline: "19/03" },
  { id: 2, title: "Lançamento do app mobile", progress: 90, status: "em andamento", steps: "2/3 etapas", deadline: "03/04" },
  { id: 3, title: "Curso de inglês", progress: 0, status: "cancelado", steps: "0/3 etapas", deadline: "18/05" },
  { id: 4, title: "Planejamento financeiro 2024", progress: 100, status: "concluído", steps: "3/3 etapas", deadline: "18/01" },
];

const statusColors: Record<string, string> = {
  "em andamento": "text-primary bg-primary/10",
  concluído: "text-[hsl(var(--nectar-green))] bg-[hsl(var(--nectar-green))]/10",
  cancelado: "text-destructive bg-destructive/10",
};

export const ProjectsView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <FolderKanban className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-sm">Projetos</h2>
          <p className="text-xs text-muted-foreground">{projects.length} projetos</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {projects.map((p) => (
            <Card key={p.id} className="bg-card/50 border-border/50 hover:border-primary/20 transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{p.title}</h3>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", statusColors[p.status])}>
                    {p.status}
                  </span>
                </div>
                <Progress value={p.progress} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.steps}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.deadline}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
