import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, CheckCircle2, Mail } from "lucide-react";

export const SettingsIntegrationsView = () => {
  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrações</h1>
        <p className="text-muted-foreground">Configure suas conexões com serviços externos.</p>
      </div>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Calendar</CardTitle>
              <CardDescription>Autenticação gerenciada via login com Google — nenhuma configuração manual necessária.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Conectado automaticamente ao fazer login com Google.</span>
          </div>
        </CardContent>
      </Card>

      {/* Gmail */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Mail className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Gmail</CardTitle>
              <CardDescription>Leia e envie emails diretamente pelo Maxx. Usa as mesmas credenciais do Google Calendar.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Requer autorização OAuth com escopos do Gmail.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Para habilitar, adicione os escopos <code className="text-primary">gmail.readonly</code> e <code className="text-primary">gmail.send</code> ao seu projeto no Google Cloud Console, 
              e re-autorize o Google Calendar para incluir os novos escopos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
