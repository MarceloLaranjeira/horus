import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Loader2, Unlink, ExternalLink, Mail } from "lucide-react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "sonner";

export const SettingsIntegrationsView = () => {
  const { connected, loading, connect, disconnect } = useGoogleCalendar();
  const [disconnecting, setDisconnecting] = useState(false);

  // Handle OAuth callback code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      // Exchange code handled by the hook when it detects code in URL
    }
  }, []);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (e: any) {
      toast.error(e.message || "Erro ao conectar");
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnect();
      toast.success("Conta Google desconectada (Agenda e Gmail)");
    } catch (e: any) {
      toast.error(e.message || "Erro ao desconectar");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Google (Agenda + Gmail)</CardTitle>
              <CardDescription>
                Uma única conexão libera sua agenda e seus emails. O Horus poderá ler e criar eventos e ler e enviar emails.
              </CardDescription>
            </div>
            {!loading && (
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                connected
                  ? "bg-[hsl(var(--nectar-green))]/10 text-[hsl(var(--nectar-green))]"
                  : "bg-muted text-muted-foreground"
              }`}>
                {connected ? "Conectado" : "Desconectado"}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando conexão...
            </div>
          ) : connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                <span className="text-muted-foreground">Agenda sincronizada — o Horus pode ver e criar eventos.</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[hsl(var(--nectar-green))]" />
                <span className="text-muted-foreground">Gmail conectado — o Horus pode ler e enviar emails.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5 mr-1.5" />}
                Desconectar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Conecte sua conta Google para que o Horus acesse sua agenda e seus emails.
              </p>
              <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Google Calendar — ler e criar eventos</span>
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Gmail — ler e enviar emails</span>
              </div>
              <Button onClick={handleConnect} size="sm" className="gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" />
                Conectar conta Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
